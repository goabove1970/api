import { Transaction, ProcessingStatus, TransactionUpdateArgs } from '@models/transaction/transaction';
import { TransactionReadArg, SortOrder } from '@models/transaction/TransactionReadArgs';
import {
    TransacitonPersistenceController,
    transactionDatabaseController,
} from '@controllers/data-controller/transaction/TransacitonPersistenceController';
import { GuidFull } from '@utils/generateGuid';
import { chaseTransactionParser } from '@controllers/data-controller/chase/ChaseTransactionFileDataController';
import businessesController, { BusinessesController } from '@controllers/business-controller';
import { TransactionDeleteArgs, TransactionsDeleteArgs } from '@routes/request-types/TransactionRequests';
import { DatabaseError } from '@models/errors/errors';
import {
    validateTransactionCreateArgs,
    validateTransactionUpdateArgs,
} from '@controllers/data-controller/transaction/helper';
import { TransactionImportResult } from '../../models/transaction/TransactionImportResult';
import { Business } from '@root/src/models/business/Business';
import moment = require('moment');
import { getSameConcat, getSame } from '@root/src/utils/transUtils';
import { MergeResult } from '@root/src/models/transaction/mergeResults';

export class TransactionController {
    dataController: TransacitonPersistenceController;
    businessesController: BusinessesController;

    constructor(dataController: TransacitonPersistenceController, businessesController: BusinessesController) {
        this.dataController = dataController;
        this.businessesController = businessesController;
    }

    update(args: TransactionUpdateArgs): Promise<void> {
        return this.read({
            transactionId: args.transactionId,
        }).then((transaction) => {
            if (!transaction) {
                throw new DatabaseError('transaction not found');
            }

            validateTransactionUpdateArgs(args);
            return this.dataController.update(args);
        });
    }

    delete(args: TransactionDeleteArgs): Promise<void> {
        return this.dataController.delete(args);
    }

    deleteTransactions(args: TransactionsDeleteArgs): Promise<void> {
        return this.dataController.deleteTransactions(args);
    }

    read(args: TransactionReadArg): Promise<number | Transaction[]> {
        if (!args.reloadTransactions && !args.accountId && (!args.accountIds || args.accountIds.length === 0)) {
            return Promise.resolve([]);
        }
        return this.dataController.read(args);
    }

    private addTransactionImpl(transaction: Transaction, accountId: string): Promise<string> {
        const newTransaction: Transaction = {
            ...transaction,
            accountId: accountId || transaction.accountId,
            transactionId: GuidFull(),
        };
        validateTransactionCreateArgs(newTransaction);

        return this.categorize(newTransaction)
            .then((tr) => {
                this.dataController.add(tr);
                return tr.transactionId;
            })
            .catch((err) => {
                throw err;
            });
    }

    addTransaction(transaction: Transaction, accountId: string): Promise<TransactionImportResult> {
        return this.addTransactions([transaction], accountId);
    }

    importTransactionsFromCsv(transactionsCsv: string, accountId: string): Promise<TransactionImportResult> {
        const chaseTransactions = chaseTransactionParser.parseFile(transactionsCsv);
        const pending = chaseTransactions.map((tr) => {
            return {
                chaseTransaction: {
                    ...tr,
                },
            } as Transaction;
        });
        return this.addTransactions(pending, accountId);
    }

    addTransactions(bulk: Transaction[], accountId: string): Promise<TransactionImportResult> {
        const result: TransactionImportResult = {
            parsed: 0,
            duplicates: 0,
            newTransactions: 0,
            businessRecognized: 0,
            multipleBusinessesMatched: 0,
            unrecognized: 0,
            unposted: 0,
            toBeDeleted: 0,
        };

        return this.mergeWithExisting(bulk, accountId)
            .then((merged: MergeResult) => {
                result.parsed = bulk.length;
                bulk = bulk.filter(this.isTransactionPosted);
                result.unposted = result.parsed - bulk.length;
                result.newTransactions = merged.toBeAdded.length;
                result.toBeDeleted = merged.toBeRemoved.length;
                result.duplicates = result.parsed - result.newTransactions;
                return merged;
            })
            .then((merged: MergeResult) => {
                const transactions = merged.toBeAdded.map(async (tr: Transaction) => {
                    const transPromise: Promise<Transaction> = this.categorize(tr);
                    return transPromise;
                });
                return Promise.all(transactions).then((categorized) => {
                    return { categorized, merged };
                });
            })
            .then(({ categorized, merged }) => {
                result.businessRecognized = categorized.filter(
                    (tr) => tr.processingStatus & ProcessingStatus.merchantRecognized
                ).length;
                result.multipleBusinessesMatched = categorized.filter(
                    (tr) => tr.processingStatus & ProcessingStatus.multipleBusinessesMatched
                ).length;
                result.unrecognized = categorized.filter(
                    (tr) => tr.processingStatus & ProcessingStatus.merchantUnrecognized
                ).length;

                const addPromises = categorized.map((tr) => this.addTransactionImpl(tr, accountId));
                const deleteArgs: TransactionsDeleteArgs = {
                    transactionIds: merged.toBeRemoved.map((t) => t.transactionId),
                };
                const removePromis = this.deleteTransactions(deleteArgs);
                const allPromises = [...addPromises, removePromis];
                return Promise.all(allPromises);
            })
            .then(() => {
                return Promise.resolve(result);
            })
            .catch((err) => {
                throw err;
            });
    }

    isTransactionPosted(trans: Transaction): boolean {
        return trans.chaseTransaction.PostingDate !== undefined;
    }

    mergeWithExisting(pending: Transaction[], accountId: string): Promise<MergeResult> {
        const comparisonDepth = 90;

        // sort pennding transactions by posting date accending
        // pending[0] is the earliest
        // pending[pending.length - 1] is the latest
        const pendingPosted = pending
            .filter((tr) => tr.chaseTransaction.PostingDate !== undefined)
            .sort((p1, p2) =>
                moment(p1.chaseTransaction.PostingDate).isBefore(moment(p2.chaseTransaction.PostingDate)) ? -1 : 1
            );
        if (!pendingPosted || pendingPosted.length === 0) {
            const emptyResult: MergeResult = {
                toBeAdded: [],
                toBeRemoved: [],
            };
            return Promise.resolve(emptyResult);
        }

        // from DB: posted transactions sorted by date descending
        const readArgs = {
            accountId,
            order: SortOrder.descending,
            readCount: comparisonDepth,
        };
        return this.dataController.read(readArgs).then((readData: number | Transaction[]) => {
            const lastExistingPosted = (readData as Transaction[]).filter(
                (tr) => tr.chaseTransaction.PostingDate !== undefined
            );
            // if there are no transactions in database, return all pending transactions
            if (lastExistingPosted.length === 0) {
                const res: MergeResult = {
                    toBeAdded: pendingPosted,
                    toBeRemoved: [],
                };
                return Promise.resolve(res);
            }

            // assuming it may take up to 5 days for transaction to post,
            // we will start from a date of the last existing transaction in database, minus 5 days
            const lastPolledRecord = pendingPosted[pendingPosted.length - 1];
            const lastDbRecord = lastExistingPosted[0];
            const lastTransactionDate = moment(lastDbRecord.chaseTransaction.PostingDate).isBefore(
                moment(lastPolledRecord.chaseTransaction.PostingDate)
            )
                ? lastDbRecord.chaseTransaction.PostingDate
                : lastPolledRecord.chaseTransaction.PostingDate;
            const beginningDate = moment(lastTransactionDate).subtract(comparisonDepth, 'days');
            const today = moment();

            let toBeAdded: Transaction[] = [];
            let toBeRemoved: Transaction[] = [];

            for (
                let date = beginningDate;
                date.startOf('day').isSameOrBefore(today.startOf('day'));
                date.add(1, 'day')
            ) {
                const thisDayDbRecords = lastExistingPosted.filter((t) =>
                    moment(t.chaseTransaction.PostingDate)
                        .startOf('day')
                        .isSame(date.startOf('day'))
                );
                const thisDayFromBank = pendingPosted.filter((t) => {
                    const collDate = moment(t.chaseTransaction.PostingDate).startOf('day');

                    const iteratorDate = date.startOf('day');
                    return collDate.isSame(iteratorDate);
                });
                if (thisDayFromBank.length === 0) {
                    continue;
                }

                // 1. iterate through each transaction from bank
                thisDayFromBank.forEach((transactionFromBank: Transaction) => {
                    const sameTransactionsInDb = getSameConcat(thisDayDbRecords, toBeAdded, transactionFromBank);
                    if (sameTransactionsInDb.length > 0) {
                        // database has more than one copy for this transaction
                        // possible if:
                        // 1. multiple same transactions on this day from bank
                        // 1.1. check how many transactions like this came from bank
                        // caviat here - one adding one transaction to database,
                        // include [sameTransactionsInDb and toBeAdded] in search for
                        // thisDayFromBank transactions to avoid double-insert to db
                        const sameTransactionsFromBank = getSameConcat(thisDayFromBank, toBeAdded, transactionFromBank);
                        // 1.1.1 if same number -- ignore
                        if (sameTransactionsFromBank.length > sameTransactionsInDb.length) {
                            // 1.1.2 if more -- should be added to database
                            toBeAdded.push(transactionFromBank);
                        } else if (sameTransactionsFromBank.length < sameTransactionsInDb.length) {
                            // 1.1.3 if less - database contains duplicates of the same bank transaction
                            toBeRemoved.push(transactionFromBank);
                            // to avoid double removing from database, remove it from thisDayDbRecords
                            const tr = getSame(thisDayDbRecords, transactionFromBank);
                            if (tr && tr.length > 0) {
                                const indexToRemove = thisDayDbRecords.indexOf(tr[0]);
                                thisDayDbRecords.splice(indexToRemove, 1);
                            }
                        }
                    } else {
                        // no such transactions in db, should be added to database
                        toBeAdded.push(transactionFromBank);
                    }
                });

                // 2. iterate through each transaction in database
                thisDayDbRecords.forEach((transactionFromDb: Transaction) => {
                    const sameTransactionsFromBank = getSame(thisDayFromBank, transactionFromDb);
                    if (sameTransactionsFromBank.length > 0) {
                        const sameInDb = getSameConcat(thisDayDbRecords, toBeAdded, transactionFromDb);
                        const countInDb = sameInDb.length;
                        const countFromBank = sameTransactionsFromBank.length;

                        if (countInDb > countFromBank) {
                            toBeRemoved.push(transactionFromDb);
                            const tr = getSame(thisDayDbRecords, transactionFromDb);
                            if (tr && tr.length > 0) {
                                const indexToRemove = thisDayDbRecords.indexOf(tr[0]);
                                thisDayDbRecords.splice(indexToRemove, 1);
                            }
                        }
                    } else {
                        // sameTransactionsFromBank.length == 0
                        // bank has no such transactions for this date,
                        toBeAdded.push(transactionFromDb);
                    }
                });
            }
            return Promise.resolve({ toBeAdded, toBeRemoved });
        });
    }

    async testRegex(rgx: string): Promise<Transaction[]> {
        const unrecognized = ((await this.dataController.read({})) as Transaction[]).filter(
            (tr) => tr.chaseTransaction.PostingDate !== null && tr.businessId === null
        );
        const regex = RegExp(rgx, 'g');
        const matches = unrecognized.filter((transaction) => {
            return regex.test(transaction.chaseTransaction.Description);
        });

        return matches;
    }

    async testBusinessRegex(businessId: string): Promise<Transaction[]> {
        const unrecognized = ((await this.dataController.read({})) as Transaction[]).filter(
            (tr) => tr.chaseTransaction.PostingDate !== null && tr.businessId === null
        );

        const business = await this.businessesController.read({ businessId });
        if (business && business.length === 1) {
            const matches = unrecognized.filter((transaction) => {
                return business[0].regexps.some((rgx) => {
                    const regex = RegExp(rgx, 'g');
                    return regex.test(transaction.chaseTransaction.Description);
                });
            });

            return matches;
        }

        return [];
    }

    recognize(): Promise<Transaction[]> {
        return this.dataController
            .read({})
            .then((readRes) => {
                const unrecognized = (readRes as Transaction[]).filter(
                    (tr) => tr.chaseTransaction.PostingDate !== null && tr.businessId === null
                );
                return unrecognized;
            })
            .then((unrecognized: Transaction[]) => {
                const business = this.businessesController.read({});
                const promises = [unrecognized, business];
                return Promise.all(promises);
            })
            .then((resolved) => {
                const arg = {
                    unrecognized: resolved[0] as Transaction[],
                    businesses: resolved[1] as Business[],
                };
                return arg;
            })
            .then((arg) => {
                const unrecognized: Transaction[] = arg[0];
                const business = arg[1];
                const recognized: Transaction[] = [];
                business.forEach((b) => {
                    const recognizedSets = new Set(recognized.map((t) => t.transactionId));
                    const stillUnrecognized = unrecognized.filter((ur) => !recognizedSets.has(ur.transactionId));
                    const recognizedForBusiness = stillUnrecognized.filter((transaction) => {
                        return b.regexps.some((rgx) => {
                            const regex = RegExp(rgx, 'g');
                            return regex.test(transaction.chaseTransaction.Description);
                        });
                    });

                    recognizedForBusiness.forEach((ur) => {
                        ur.businessId = b.businessId;
                        recognized.push(ur);
                    });
                });

                recognized.forEach((tr) =>
                    this.update({
                        transactionId: tr.transactionId,
                        businessId: tr.businessId,
                        processingStatus:
                            tr.processingStatus &
                            ProcessingStatus.merchantRecognized &
                            ProcessingStatus.merchantUnrecognized,
                    })
                );

                return Promise.resolve(recognized);
            });
    }

    assignBusinessMatchingTransactions(rgx: string): Promise<Transaction[]> {
        return this.dataController
            .read({})
            .then((readResult) => {
                const transactions = readResult as Transaction[];
                const unrecognized = transactions.filter(
                    (tr) => tr.chaseTransaction.PostingDate !== undefined && tr.businessId === undefined
                );
                return unrecognized;
            })
            .then((unrecognized) => {
                const regex = RegExp(rgx, 'g');
                const matches = unrecognized.filter((transaction) => {
                    return regex.test(transaction.chaseTransaction.Description);
                });

                return Promise.resolve(matches);
            })
            .catch((err) => {
                throw err;
            });
    }

    categorize(transaction: Transaction): Promise<Transaction> {
        return this.businessesController
            .getCache()
            .then((cache: { businesses: Business[] }) => {
                const matchingBusinesses = cache.businesses.filter((business) => {
                    return (
                        business.regexps &&
                        business.regexps.some((reg) => {
                            var regex = RegExp(reg, 'g');
                            return regex.test(transaction.chaseTransaction.Description);
                        })
                    );
                });
                transaction.processingStatus = 0;
                if (matchingBusinesses && matchingBusinesses.length === 1) {
                    transaction.businessId = matchingBusinesses[0].businessId;
                    transaction.processingStatus = transaction.processingStatus ^ ProcessingStatus.merchantRecognized;
                    transaction.categoryId = matchingBusinesses[0].defaultCategoryId;
                } else if (matchingBusinesses.length > 1) {
                    transaction.processingStatus =
                        transaction.processingStatus ^ ProcessingStatus.multipleBusinessesMatched;
                } else {
                    transaction.processingStatus = transaction.processingStatus ^ ProcessingStatus.merchantUnrecognized;
                }

                return Promise.resolve(transaction);
            })
            .catch((err) => {
                throw err;
            });
    }
}

export const transactionController = new TransactionController(transactionDatabaseController, businessesController);
