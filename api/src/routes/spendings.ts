import { Router } from 'express';

import { SpendingRequestError } from '@models/errors/errors';
import { DeepPartial } from '@models/DeepPartial';
import accountController from '@controllers/account-controller';
import { transactionProcessor } from '@controllers/transaction-processor-controller/TransactionProcessor';
import { UserAccount, AccountType } from '@models/accounts/Account';
import {
    SpendingRequest,
    SpendingResponse,
    SpendingRequestArgs,
    CategorySpending,
    MonthlyBalance,
} from './request-types/SpendingsRequest';
import { Transaction } from '../models/transaction/Transaction';
import { TransactionReadArg } from '../models/transaction/TransactionReadArgs';
import { isExcludedFromBalanceTransaction, isHiddenTransaction } from '../utils/transUtils';
import categoryController from '../controllers/category-controller';
import { Category } from '../models/category/category';
import moment = require('moment');
import { isDebitAccountType, isCreditAccountType } from '../utils/accountUtils';

const router = Router();

async function process(req, res, next) {
    console.log(`Received a request in spending controller: ${JSON.stringify(req.body, null, 4)}`);
    const spendingRequest = req.body as SpendingRequest;
    if (!spendingRequest) {
        return res.status(500).send(new SpendingRequestError());
    }

    let responseData: SpendingResponse = {};
    try {
        switch (spendingRequest.action) {
            case 'read':
                responseData = await processReadSpendingRequest(spendingRequest.args);
                break;

            default:
                return res
                    .status(500)
                    .send(new SpendingRequestError(`Unknown spending request type: ${spendingRequest.action}`));
        }
    } catch (err) {
        return res
            .status(500)
            .send(new SpendingRequestError(`Error processing spending request: ${err.message || err}`));
    }

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'content-type');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.send(responseData);
}
router.get('/', process);
router.post('/', process);

function validateReadRequest(args: SpendingRequestArgs): void {
    if (!args.userId) {
        const error = 'Recevied spending request with empty userId';
        console.error(error);
        throw error;
    }
}

interface MonthlyCategorySpending {
    parentCategoryId?: string;
    categoryId?: string;
    categoryName?: string;
    month?: Date;
    monthName?: string;
    debit?: number;
    credit?: number;
}

function buildSpendingsByMonth(
    transactions: Transaction[],
    categories: Map<string, Category>,
    accounts: Map<string, DeepPartial<UserAccount>>
): {
    parents: MonthlyCategorySpending[];
    subs: MonthlyCategorySpending[];
} {
    const result = {
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

    for (let iter = moment(borders.start); iter.isBefore(borders.end); iter = iter.add(1, 'months')) {
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
            const rootId = getRootCategoryId(transaction.categoryId, categories);
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

            upadteTotal(parent, account.accountType, transaction.chaseTransaction.Amount);

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
                upadteTotal(sub, account.accountType, transaction.chaseTransaction.Amount);
            }
        }); // end of transactions foreach
        allParents.push(...parents.values());
        allSubs.push(...subs.values());
    } // end of month foreach

    result.parents = allParents;
    result.subs = allSubs;
    return result;
}

async function buildMonthlyBalances(trans: Transaction[], accts: Map<string, UserAccount>): Promise<MonthlyBalance[]> {
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
            upadteTotal(spending, acct.accountType, tr.chaseTransaction.Amount);
        });
    }
    return res;
}

async function processReadSpendingRequest(args: SpendingRequestArgs): Promise<SpendingResponse> {
    console.log(`Processing read request in spending router`);
    validateReadRequest(args);
    const response: SpendingResponse = {
        action: 'read',
        startDate: args.startDate,
        endDate: args.endDate,
        subCatgories: [],
        categories: [],
        spendingsByMonth: [],
        annualBalances: [],
    };

    try {
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

        // get transactions between now and minus one year
        const yearlyTransactionsArgs: TransactionReadArg = {
            startDate: moment()
                .subtract(1, 'year')
                .toDate(),
            endDate: moment().toDate(),
            accountIds: acctids,
        };
        const transactionsYearly = ((await transactionProcessor.read(yearlyTransactionsArgs)) as Transaction[]).filter(
            (t) => !isHiddenTransaction(t) && !isExcludedFromBalanceTransaction(t)
        );
        response.annualBalances = await buildMonthlyBalances(transactionsYearly, accountsMap);

        const trarg: TransactionReadArg = {
            startDate: args.startDate,
            endDate: args.endDate,
            accountIds: acctids,
        };
        const transactions = ((await transactionProcessor.read(trarg)) as Transaction[]).filter(
            (t) => !isHiddenTransaction(t) && !isExcludedFromBalanceTransaction(t)
        );

        const parentCategories = new Map<string, CategorySpending>();

        const uncategorized: CategorySpending = {
            name: 'Uncategorized',
            debit: 0,
            credit: 0,
            saldo: 0,
        };
        const subCatgories = new Map<string, CategorySpending>();

        transactions.forEach((t) => {
            const account = accountsMap.get(t.accountId);

            // handles undefined / unknown categories
            if (!categoriesMap.has(t.categoryId)) {
                addTransaction(uncategorized, t, account, parentCategories, subCatgories);
                return;
            }

            // add/retrieve a spending category from parents/subcategories
            const catDetails = categoriesMap.get(t.categoryId);
            let spendingCat: CategorySpending;
            // let rootCat: CategorySpending = undefined;
            if (catDetails.parentCategoryId) {
                // this transaction belongs to a subcategory
                if (subCatgories.has(t.categoryId)) {
                    spendingCat = subCatgories.get(t.categoryId);
                } else {
                    spendingCat = {
                        name: catDetails.caption,
                        categoryId: catDetails.categoryId,
                        parentCategoryId: catDetails.parentCategoryId,
                        debit: 0,
                        credit: 0,
                        saldo: 0,
                    };
                    subCatgories.set(t.categoryId, spendingCat);
                }

                //get the most parent category for current subcategory
                const root = getRootCategory(categoriesMap, catDetails);
                let rootCat: CategorySpending;
                if (root !== undefined) {
                    if (!parentCategories.has(root.categoryId)) {
                        rootCat = {
                            name: root.caption,
                            categoryId: root.categoryId,
                            parentCategoryId: root.parentCategoryId,
                            debit: 0,
                            credit: 0,
                            saldo: 0,
                        };
                        parentCategories.set(rootCat.categoryId, rootCat);
                    }
                }
            } else {
                // this transaction belongs to a parent category
                if (parentCategories.has(t.categoryId)) {
                    spendingCat = parentCategories.get(t.categoryId);
                } else {
                    spendingCat = {
                        name: catDetails.caption,
                        categoryId: catDetails.categoryId,
                        parentCategoryId: catDetails.parentCategoryId,
                        debit: 0,
                        credit: 0,
                        saldo: 0,
                    };
                    parentCategories.set(t.categoryId, spendingCat);
                }
            }
            addTransaction(spendingCat, t, account, parentCategories, subCatgories);
        });

        response.categories = [];
        response.subCatgories = [];
        response.spendingProgression = [];
        response.spendingsByMonth = buildSpendingsByMonth(transactions, categoriesMap, accountsMap);

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
                upadteTotal(daySpendings, account.accountType, t.chaseTransaction.Amount);
            });
            cumulative.credit += daySpendings.credit;
            cumulative.debit += daySpendings.debit;
            response.spendingProgression.push({
                date: i,
                credit: daySpendings.credit,
                debit: daySpendings.debit,
                cumulateDebit: cumulative.debit,
                cumulateCredit: cumulative.credit,
            });
        }

        parentCategories.forEach((element) => {
            response.categories.push(element);
        });

        subCatgories.forEach((element) => {
            response.subCatgories.push(element);
        });

        if (!args.includeSubcategories) {
            delete response.subCatgories;
        }

        return response;
    } catch (error) {
        console.error(error.message);
        response.error = error.message;
    }
    return response;
}

const upadteTotal = (spending: { credit?: number; debit?: number }, accountType: AccountType, amount: number): void => {
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

const addTransaction = (
    cat: CategorySpending,
    t: Transaction,
    acc: DeepPartial<UserAccount>,
    parentCategories: Map<string, CategorySpending>,
    subcategories: Map<string, CategorySpending>
): void => {
    // now update parent categories for this category
    let categoryIdIterator = cat.categoryId;
    let categoryToUpdate: CategorySpending;
    while (categoryIdIterator !== undefined) {
        // will begoing up until we end up finding the parent category
        if (subcategories.has(categoryIdIterator)) {
            categoryToUpdate = subcategories.get(categoryIdIterator);
        } else if (parentCategories.get(categoryIdIterator)) {
            categoryToUpdate = parentCategories.get(categoryIdIterator);
        } else {
            break;
        }
        upadteTotal(categoryToUpdate, acc.accountType, t.chaseTransaction.Amount);
        categoryToUpdate.saldo = categoryToUpdate.credit - categoryToUpdate.debit;
        categoryIdIterator = categoryToUpdate.parentCategoryId;
    }
};

const getRootCategory = (allCategories: Map<string, Category>, forCategory?: Category): Category | undefined => {
    if (forCategory.parentCategoryId === undefined) {
        return forCategory;
    }

    if (allCategories.has(forCategory.parentCategoryId)) {
        return getRootCategory(allCategories, allCategories.get(forCategory.parentCategoryId));
    } else {
        return undefined; // broken chain of categories
    }
};

const getRootCategoryId = (forCategory: string, allCategories: Map<string, Category>): string | undefined => {
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

    return getRootCategoryId(parent.parentCategoryId, allCategories);
};

export = router;
