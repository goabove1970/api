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
} from './request-types/SpendingsRequest';
import { Transaction } from '../models/transaction/Transaction';
import { TransactionReadArg } from '../models/transaction/TransactionReadArgs';
import { isExcludedFromBalanceTransaction, isHiddenTransaction } from '../utils/transUtils';
import categoryController from '../controllers/category-controller';
import { Category } from '../models/category/category';
import moment = require('moment');

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

async function processReadSpendingRequest(args: SpendingRequestArgs): Promise<SpendingResponse> {
    console.log(`Processing read request in spending router`);
    validateReadRequest(args);
    const response: SpendingResponse = {
        action: 'read',
        startDate: args.startDate,
        endDate: args.endDate,
        subCatgories: [],
        categories: [],
    };

    try {
        return await accountController
            .getUserAccounts(args.userId)
            .then((accounts: DeepPartial<UserAccount>[]) => {
                const trans: Promise<Transaction[] | number>[] = [];
                for (let i = 0; i < accounts.length; i++) {
                    const trarg: TransactionReadArg = {
                        startDate: args.startDate,
                        endDate: args.endDate,
                        accountId: accounts[i].accountId,
                    };
                    const t = transactionProcessor.read(trarg);
                    trans.push(t);
                }
                return Promise.all(trans)
                    .then((res: (number | Transaction[])[]) => {
                        let trans: Transaction[] = [];
                        res.forEach((r) => {
                            trans = trans.concat(r as Transaction[]);
                        });
                        return trans;
                    })
                    .then((tr) => {
                        return {
                            transactions: tr,
                            accounts,
                        };
                    });
            })
            .then((vals) => {
                const categories = categoryController.read({ userId: args.userId });
                return Promise.resolve(categories).then((cat) => {
                    return {
                        transactions: vals.transactions,
                        categories: cat,
                        accounts: vals.accounts,
                    };
                });
            })
            .then(
                (res: {
                    transactions: Transaction[];
                    categories: Category[];
                    accounts: DeepPartial<UserAccount>[];
                }) => {
                    const categoriesMap = new Map<string, Category>();
                    const accountsMap = new Map<string, DeepPartial<UserAccount>>();
                    const parentCategories = new Map<string, CategorySpending>();

                    const uncategorized: CategorySpending = {
                        name: 'Uncategorized',
                        debit: 0,
                        credit: 0,
                        saldo: 0,
                    };
                    const subCatgories = new Map<string, CategorySpending>();

                    res.categories.forEach((c) => {
                        const existing = categoriesMap.has(c.categoryId);
                        if (!existing) {
                            categoriesMap.set(c.categoryId, c);
                        }
                    });
                    res.accounts.forEach((c) => {
                        const existing = accountsMap.has(c.accountId);
                        if (!existing) {
                            accountsMap.set(c.accountId, c);
                        }
                    });
                    res.transactions.forEach((t) => {
                        if (isHiddenTransaction(t) || isExcludedFromBalanceTransaction(t)) {
                            return;
                        }
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
                    const lastTransaction = res.transactions.reduce(
                        maxDateReducer,
                        moment()
                            .subtract('years', 1000)
                            .toDate()
                    );
                    const startDate = moment(lastTransaction)
                        .startOf('day')
                        .subtract(1, 'months');
                    const transactions = res.transactions.filter((t) =>
                        startDate.isBefore(t.chaseTransaction.PostingDate)
                    );

                    for (
                        let i = startDate.startOf('day').toDate();
                        moment(i).isBefore(lastTransaction);
                        i = moment(i)
                            .add(1, 'days')
                            .startOf('day')
                            .toDate()
                    ) {
                        const dayTransactions = transactions.filter((t) =>
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
                }
            )
            .catch((error) => {
                throw error;
            });
    } catch (error) {
        console.error(error.message);
        response.error = error.message;
    }
    return response;
}

const upadteTotal = (spending: CategorySpending, accountType: AccountType, amount: number): void => {
    if (accountType === AccountType.Debit) {
        // negative number is debit, positive is credit
        if (amount > 0) {
            spending.credit += Math.abs(amount);
        } else {
            spending.debit += Math.abs(amount);
        }
    } else if (accountType === AccountType.Credit) {
        // negative is credit, positive is debit
        if (amount > 0) {
            spending.debit += Math.abs(amount);
        } else {
            spending.credit += Math.abs(amount);
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

export = router;
