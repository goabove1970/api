import { Transaction } from "@models/transaction/transaction";
import { Category } from "@models/category/category";
import { DeepPartial } from "@models/DeepPartial";
import { UserAccount, AccountType } from "@models/accounts/Account";
import { MonthlyCategorySpending } from "@models/spendings/MonthlyCategorySpending";
import moment = require("moment");
import { isDebitAccountType, isCreditAccountType } from "@utils/accountUtils";
import { SpendingRequestArgs, SpendingResponse } from "@routes/request-types/SpendingsRequest";
import { MonthlyBalance } from "@models/spendings/MonthlyBalance";
import accountController from "@controllers/account-controller";
import categoryController from "@controllers/category-controller";
import { TransactionReadArg } from "@models/transaction/TransactionReadArgs";
import { transactionProcessor } from "@controllers/transaction-processor-controller/TransactionProcessor";
import { isHiddenTransaction, isExcludedFromBalanceTransaction } from "@utils/transUtils";
import { SpendingProgressionItem } from "@models/spendings/SpendingProgressionItem";
import { BaseSpending } from "@models/spendings/BaseSpending";
import { CategorySpending } from "@models/spendings/CategorySpending";
import { SpendingsByMonth } from "@models/spendings/SpendingsByMonth";

export interface CategorizationResult {
    parents: Map<string, CategorySpending>;
    subs?: Map<string, CategorySpending>;
}

export class SpendingsController {

    newSpendingCat(category: Category): CategorySpending {
        return {
            name: category.caption,
            categoryId: category.categoryId,
            parentCategoryId: category.parentCategoryId,
            debit: 0,
            credit: 0,
            saldo: 0,
        };
    }

    categorize(transactions: Transaction[],
        accountsMap: Map<string, UserAccount>,
        categoriesMap: Map<string, Category>,
        includeSubcategories: boolean): CategorizationResult {

        let res: CategorizationResult = {
            parents: new Map<string, CategorySpending>(),
        };

        if (includeSubcategories) {
            res.subs = new Map<string, CategorySpending>();
        }

        // const parentCategories = new Map<string, CategorySpending>();

        const uncategorized: CategorySpending = {
            name: 'Uncategorized',
            debit: 0,
            credit: 0,
            saldo: 0,
        };
        // const subCatgories = new Map<string, CategorySpending>();

        transactions.forEach((t: Transaction) => {
            const account = accountsMap.get(t.accountId);

            // handles undefined / unknown categories
            if (!categoriesMap.has(t.categoryId)) {
                this.addTransaction(uncategorized, t, account, res.parents, categoriesMap, res.subs);
                return;
            }

            // add/retrieve a spending category from parents/subcategories
            const catDetails = categoriesMap.get(t.categoryId);
            let spendingCat: CategorySpending;
            // let rootCat: CategorySpending = undefined;
            if (catDetails.parentCategoryId) {
                // this transaction belongs to a subcategory
                if (includeSubcategories) {
                    if (res.subs && res.subs.has(t.categoryId)) {
                        spendingCat = res.subs.get(t.categoryId);
                    } else {
                        spendingCat = this.newSpendingCat(catDetails);
                        if (res.subs) {
                            res.subs.set(t.categoryId, spendingCat);
                        }
                    }
                }

                //get the most parent category for current subcategory
                const root = this.getRootCategory(categoriesMap, catDetails);
                let rootCat: CategorySpending;
                if (root !== undefined) {
                    if (!res.parents.has(root.categoryId)) {
                        rootCat = this.newSpendingCat(root);
                        res.parents.set(rootCat.categoryId, rootCat);
                    }
                }
            } else {
                // this transaction belongs to a parent category
                if (res.parents.has(t.categoryId)) {
                    spendingCat = res.parents.get(t.categoryId);
                } else {
                    spendingCat = this.newSpendingCat(catDetails);
                    res.parents.set(t.categoryId, spendingCat);
                }
            }
            this.addTransaction(spendingCat, t, account, res.parents, categoriesMap, res.subs);
        });

        return res;
    }

    buildSpendingProgression(transactions: Transaction[],
        accountsMap: Map<string, UserAccount>): SpendingProgressionItem[] {
        const res: SpendingProgressionItem[] = [];
        const cumulative = {
            debit: 0,
            credit: 0,
        };
        const maxDateReducer = (maxDate: Date, t: Transaction) => {
            if (moment(t.chaseTransaction.PostingDate).isAfter(maxDate)) {
                return t.chaseTransaction.PostingDate;
            }
            return maxDate;
        };
        const lastTransaction = transactions.reduce(
            maxDateReducer,
            moment()
                .subtract(1000, 'years')
                .toDate()
        );
        const startDate = moment(lastTransaction)
            .startOf('day')
            .subtract(1, 'months');

        // take all transactions between the last transaction date and minus one month
        const transactionsMonth = transactions.filter((t) => startDate.isBefore(t.chaseTransaction.PostingDate));
        for (
            let i = startDate.startOf('day').toDate();
            moment(i).isBefore(lastTransaction);
            i = moment(i)
                .add(1, 'days')
                .startOf('day')
                .toDate()
        ) {
            const dayTransactions = transactionsMonth.filter((t) =>
                moment(t.chaseTransaction.PostingDate)
                    .startOf('date')
                    .isSame(i)
            );
            const daySpendings: CategorySpending = {
                credit: 0,
                debit: 0,
                saldo: 0,
                name: '',
            };
            dayTransactions.forEach((t: Transaction) => {
                const account = accountsMap.get(t.accountId);
                this.updateTotal(daySpendings, account.accountType, t.chaseTransaction.Amount);
            });
            cumulative.credit += daySpendings.credit;
            cumulative.debit += daySpendings.debit;
            res.push({
                date: i,
                credit: daySpendings.credit,
                debit: daySpendings.debit,
                cumulateDebit: cumulative.debit,
                cumulateCredit: cumulative.credit,
            });
        }
        return res;
    }

    async processReadSpendingRequest(args: SpendingRequestArgs): Promise<SpendingResponse> {
        const response: SpendingResponse = {
            action: 'read',
            startDate: args.startDate,
            endDate: args.endDate,
            subCatgories: [],
            categories: [],
            spendingsByMonth: {
                parents: [],
                subs: []
            },
            annualBalances: [],
        };

        // 0. Build required maps
        const accountsMap = await accountController.getMap(args.userId);
        const acctids = [...accountsMap.keys()];
        const categories = await categoryController.read({ userId: args.userId });
        const categoriesMap = new Map<string, Category>();
        categories.forEach((c) => {
            const existing = categoriesMap.has(c.categoryId);
            if (!existing) {
                categoriesMap.set(c.categoryId, c);
            }
        });

        // 1. Build Annual Balande by Month
        response.annualBalances = await this.buildMonthlyBalances(accountsMap, acctids);
        const trarg: TransactionReadArg = {
            startDate: args.startDate,
            endDate: args.endDate,
            accountIds: acctids,
        };

        // 2. Read transactions for requested time interval, requred for:
        // - Parent and Child spending categories
        // - Spending By Month
        // - Spending Progression
        const transactions = ((await transactionProcessor.read(trarg)) as Transaction[]).filter(
            (t) => !isHiddenTransaction(t) && !isExcludedFromBalanceTransaction(t)
        );

        // 3.Build Parent and Child Categories
        const categorized: CategorizationResult = this.categorize(
            transactions, accountsMap, categoriesMap, args.includeSubcategories);
        response.categories = [];
        response.subCatgories = [];
        categorized.parents.forEach((element) => {
            response.categories.push(element);
        });
        if (args.includeSubcategories) {
            categorized.subs.forEach((element) => {
                response.subCatgories.push(element);
            });
        } else {
            delete response.subCatgories;
        }

        // 4. Build Spendings by Month
        response.spendingsByMonth = this.buildSpendingsByMonth(transactions, categoriesMap, accountsMap);

        // 5. Build Spending Progression
        response.spendingProgression = this.buildSpendingProgression(transactions, accountsMap);
        return Promise.resolve(response);
    }

    buildSpendingsByMonth(
        transactions: Transaction[],
        categories: Map<string, Category>,
        accounts: Map<string, DeepPartial<UserAccount>>
    ): SpendingsByMonth {
        const result: SpendingsByMonth = {
            parents: [],
            subs: [],
        };

        interface startEnd {
            start: Date;
            end: Date;
        }
        let init: startEnd = {
            start: moment().toDate(),
            end: moment().toDate(),
        };

        const borders = transactions.reduce((previousValue: startEnd, currentValue: Transaction) => {
            const val = { ...previousValue };

            const transDate = moment(currentValue.chaseTransaction.PostingDate);
            if (transDate.isBefore(previousValue.start)) {
                val.start = transDate.toDate();
            }
            if (transDate.isAfter(previousValue.end)) {
                val.end = transDate.toDate();
            }

            return val;
        }, init);

        borders.start = moment(borders.start)
            .startOf('month')
            .toDate();
        borders.end = moment(borders.end)
            .endOf('month')
            .toDate();

        const allParents: MonthlyCategorySpending[] = [];
        const allSubs: MonthlyCategorySpending[] = [];

        for (let iter = moment(borders.start);
            iter.isBefore(borders.end);
            iter = iter.add(1, 'months')) {
            ////// monthly logic begins here
            const monthTransactions = transactions.filter(
                (t) =>
                    t.categoryId &&
                    moment(t.chaseTransaction.PostingDate)
                        .startOf('month')
                        .isSame(iter.startOf('month'))
            );

            if (!monthTransactions.length || monthTransactions.length === 0) {
                continue;
            }

            const parents = new Map<string, MonthlyCategorySpending>();
            const subs = new Map<string, MonthlyCategorySpending>();

            monthTransactions.forEach((transaction) => {
                if (!accounts.has(transaction.accountId)) {
                    return;
                }
                const account = accounts.get(transaction.accountId);
                const rootId = this.getRootCategoryId(transaction.categoryId, categories);
                if (!rootId) {
                    return;
                }

                ///// handle parent category first

                let parent: MonthlyCategorySpending;
                if (parents.has(rootId)) {
                    parent = parents.get(rootId);
                } else {
                    if (!categories.has(rootId)) {
                        return;
                    }
                    const category = categories.get(rootId);
                    parent = {
                        categoryId: rootId,
                        categoryName: category.caption,
                        debit: 0,
                        credit: 0,
                        monthName: iter.format('MMMM'),
                        month: iter.toDate(),
                    };
                    parents.set(rootId, parent);
                }

                this.updateTotal(parent, account.accountType, transaction.chaseTransaction.Amount);

                //// handle subcategory

                if (rootId !== transaction.categoryId) {
                    let sub: MonthlyCategorySpending;
                    if (subs.has(transaction.categoryId)) {
                        sub = subs.get(transaction.categoryId);
                    } else {
                        if (!categories.has(transaction.categoryId)) {
                            return;
                        }
                        const subcategory = categories.get(transaction.categoryId);
                        const parentCategory = categories.get(rootId);
                        sub = {
                            parentCategoryId: parentCategory.categoryId,
                            categoryId: subcategory.categoryId,
                            categoryName: subcategory.caption,
                            debit: 0,
                            credit: 0,
                            monthName: iter.format('MMMM'),
                            month: iter.toDate(),
                        };
                        subs.set(transaction.categoryId, sub);
                    }
                    this.updateTotal(sub, account.accountType, transaction.chaseTransaction.Amount);
                }
            }); // end of transactions foreach
            allParents.push(...parents.values());
            allSubs.push(...subs.values());
        } // end of month foreach

        result.parents = allParents;
        result.subs = allSubs;
        return result;
    }

    getRootCategory(allCategories: Map<string, Category>, forCategory?: Category): Category | undefined {
        if (forCategory.parentCategoryId === undefined) {
            return forCategory;
        }

        if (allCategories.has(forCategory.parentCategoryId)) {
            return this.getRootCategory(allCategories, allCategories.get(forCategory.parentCategoryId));
        } else {
            return undefined; // broken chain of categories
        }
    };

    getRootCategoryId(forCategory: string, allCategories: Map<string, Category>): string | undefined {
        if (!forCategory) {
            return undefined;
        }
        if (!allCategories) {
            return undefined;
        }

        if (!allCategories.has(forCategory)) {
            return undefined;
        }

        const parent = allCategories.get(forCategory);
        if (!parent.parentCategoryId) {
            return forCategory;
        }

        return this.getRootCategoryId(parent.parentCategoryId, allCategories);
    };

    updateTotal(spending: BaseSpending, accountType: AccountType, amount: number):
        void {
        if (isDebitAccountType(accountType)) {
            // negative number is debit, positive is credit
            if (amount > 0) {
                spending.credit += Math.abs(amount);
            } else {
                spending.debit += Math.abs(amount);
            }
        } else if (isCreditAccountType(accountType)) {
            // negative number is debit, positive is credit
            if (amount > 0) {
                spending.credit += Math.abs(amount);
            } else {
                spending.debit += Math.abs(amount);
            }
        }
    };

    addTransaction(
        cat: CategorySpending,
        t: Transaction,
        acc: DeepPartial<UserAccount>,
        parentCategories: Map<string, CategorySpending>,
        categoryMap: Map<string, Category>,
        subcategories?: Map<string, CategorySpending>
    ): void {
        // now update parent categories for this category
        let categoryIdIterator = cat.categoryId;
        let categoryToUpdate: CategorySpending;
        while (categoryIdIterator !== undefined) {
            // will begoing up until we end up finding the parent category
            if (subcategories && subcategories.has(categoryIdIterator)) {
                // this is a subcategory
                categoryToUpdate = subcategories.get(categoryIdIterator);
            } else if (parentCategories.get(categoryIdIterator)) {
                // this is a prent category
                categoryToUpdate = parentCategories.get(categoryIdIterator);

                // exiting if updated the most parent category for this transaction
                if (!categoryToUpdate.parentCategoryId ||
                    categoryToUpdate.parentCategoryId === null ||
                    categoryToUpdate.parentCategoryId === '' ||
                    !parentCategories.has(categoryToUpdate.parentCategoryId))
                    break;
            } else if (categoryMap.has(categoryIdIterator)) {
                // might be one of the following:
                // 1. subcategory but they are not requsted to passed empty to this function
                // 2. one or more nodes in the category tree are missing (deleted)

                const cat = categoryMap.get(categoryIdIterator);
                categoryIdIterator = cat.parentCategoryId;
                // skipping the iterator increment
                continue;
            } else {
                // unknown category id
                break;
            }
            this.updateTotal(categoryToUpdate, acc.accountType, t.chaseTransaction.Amount);
            categoryToUpdate.saldo = categoryToUpdate.credit - categoryToUpdate.debit;
            categoryIdIterator = categoryToUpdate.parentCategoryId;
        }
    };


    async buildMonthlyBalances(accts: Map<string, UserAccount>, acctids: string[]): Promise<MonthlyBalance[]> {
        // get transactions between now and minus one year
        const yearlyTransactionsArgs: TransactionReadArg = {
            startDate: moment()
                .subtract(1, 'year')
                .toDate(),
            endDate: moment().toDate(),
            accountIds: acctids,
        };
        let trans = ((await transactionProcessor.read(yearlyTransactionsArgs)) as Transaction[]).filter(
            (t) => !isHiddenTransaction(t) && !isExcludedFromBalanceTransaction(t)
        );

        if (!trans || trans.length === 0) {
            return [];
        }

        trans = trans.filter((t) => t.chaseTransaction.PostingDate !== undefined && accts.has(t.accountId));
        const res: MonthlyBalance[] = [];
        for (let iter = moment().subtract(12, 'month'); iter.isBefore(moment()); iter = iter.add(1, 'month')) {
            const spending: MonthlyBalance = {
                credit: 0,
                debit: 0,
                month: iter.startOf('month').toDate(),
            };
            res.push(spending);
            const monthTrans = trans.filter((t) =>
                moment(t.chaseTransaction.PostingDate)
                    .startOf('month')
                    .isSame(iter.startOf('month'))
            );
            monthTrans.forEach((tr) => {
                const acct = accts.get(tr.accountId);
                this.updateTotal(spending, acct.accountType, tr.chaseTransaction.Amount);
            });
        }
        return res;
    }

}

const spendingsController = new SpendingsController();
export { spendingsController };
