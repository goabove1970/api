import { Transaction } from "@models/transaction/transaction";
import { MonthlyCategorySpending } from "@models/spendings/MonthlyCategorySpending";
import moment = require("moment");
import { SpendingRequestArgs, SpendingResponse } from "@routes/request-types/SpendingsRequest";
import { MonthlyBalance } from "@models/spendings/MonthlyBalance";
import { CategoryController } from "@controllers/category-controller";
import { TransactionReadArg } from "@models/transaction/TransactionReadArgs";
import { transactionController } from "@controllers/transaction-controller/TransactionController";
import { isHiddenTransaction, isExcludedFromBalanceTransaction } from "@utils/transUtils";
import { SpendingProgressionItem } from "@models/spendings/SpendingProgressionItem";
import { CategorySpending } from "@models/spendings/CategorySpending";
import { SpendingsByMonth } from "@models/spendings/SpendingsByMonth";
import { CategorizationResult } from "./categorization-result";
import { categorize,  getRootCategoryId,  updateTotal } from "./utils";
import { AccountController } from "../account-controller/account-controller";


export class SpendingsController {
    accountController: AccountController;
    categoryController: CategoryController;
    constructor(accountController: AccountController,
        categoryController: CategoryController) {
        this.accountController = accountController;
        this.categoryController = categoryController;
    }

    buildSpendingProgression(transactions: Transaction[],
        accountsMap: {}): SpendingProgressionItem[] {
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
                const account = accountsMap[t.accountId];
                updateTotal(daySpendings, account.accountType, t.chaseTransaction.Amount);
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
        const accountsMap = await this.accountController.getMap(args.userId);
        const acctids = [];
        for (let key in accountsMap) {
            acctids.push(key);
        }
        
        const categories = await this.categoryController.read({ userId: args.userId });
        const categoriesMap = {};
        categories.forEach((c) => {
            categoriesMap[c.categoryId] = c;
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
        const transactions = ((await transactionController.read(trarg)) as Transaction[]).filter(
            (t) => !isHiddenTransaction(t) && !isExcludedFromBalanceTransaction(t)
        );

        // 3.Build Parent and Child Categories
        const categorized: CategorizationResult = categorize(
            transactions, accountsMap, categoriesMap, args.includeSubcategories);
        response.categories = [];
        response.subCatgories = [];
        for (let parentCategoryId in categorized.parents) {
            response.categories.push(categorized.parents[parentCategoryId]);
        }
        if (args.includeSubcategories) {
            for (let subCategoryId in categorized.subs) {
                response.subCatgories.push(categorized.subs[subCategoryId]);
            }
        } else {
            delete response.subCatgories;
        }

        // 4. Build Spendings by Month
        const lastYearTransactionsTrArg: TransactionReadArg = {
            startDate: moment().subtract(1, "years").toDate(),
            endDate: moment().toDate(),
            accountIds: acctids,
        };
        const lastYearTransactions = ((await transactionController.read(lastYearTransactionsTrArg)) as Transaction[]).filter(
            (t) => !isHiddenTransaction(t) && !isExcludedFromBalanceTransaction(t)
        );
        response.spendingsByMonth = this.buildSpendingsByMonth(lastYearTransactions, categoriesMap, accountsMap);

        // 5. Build Spending Progression
        response.spendingProgression = this.buildSpendingProgression(transactions, accountsMap);
        
        return Promise.resolve(response);
    }

    buildSpendingsByMonth(
        transactions: Transaction[],
        categories: {},
        accounts: {}
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
                if (!accounts[transaction.accountId]) {
                    return;
                }
                const account = accounts[transaction.accountId];
                const rootId = getRootCategoryId(transaction.categoryId, categories);
                if (!rootId) {
                    return;
                }

                ///// handle parent category first

                let parent: MonthlyCategorySpending;
                if (parents.has(rootId)) {
                    parent = parents.get(rootId);
                } else {
                    if (!categories[rootId]) {
                        return;
                    }
                    const category = categories[rootId];
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

                updateTotal(parent, account.accountType, transaction.chaseTransaction.Amount);

                //// handle subcategory

                if (rootId !== transaction.categoryId) {
                    let sub: MonthlyCategorySpending;
                    if (subs.has(transaction.categoryId)) {
                        sub = subs.get(transaction.categoryId);
                    } else {
                        if (!categories[transaction.categoryId]) {
                            return;
                        }
                        const subcategory = categories[transaction.categoryId];
                        const parentCategory = categories[rootId];
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
                    updateTotal(sub, account.accountType, transaction.chaseTransaction.Amount);
                }
            }); // end of transactions foreach
            allParents.push(...parents.values());
            allSubs.push(...subs.values());
        } // end of month foreach

        result.parents = allParents;
        result.subs = allSubs;
        return result;
    }

    

    

    

    


    async buildMonthlyBalances(accts: {}, acctids: string[]): Promise<MonthlyBalance[]> {
        // get transactions between now and minus one year
        const yearlyTransactionsArgs: TransactionReadArg = {
            startDate: moment()
                .subtract(1, 'year')
                .toDate(),
            endDate: moment().toDate(),
            accountIds: acctids,
        };
        let trans = ((await transactionController.read(yearlyTransactionsArgs)) as Transaction[]).filter(
            (t) => !isHiddenTransaction(t) && !isExcludedFromBalanceTransaction(t)
        );

        if (!trans || trans.length === 0) {
            return [];
        }

        trans = trans.filter((t) => t.chaseTransaction.PostingDate !== undefined && accts[t.accountId]);
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
                const acct = accts[tr.accountId];
                updateTotal(spending, acct.accountType, tr.chaseTransaction.Amount);
            });
        }
        return res;
    }

}
