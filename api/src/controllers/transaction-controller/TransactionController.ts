import { Transaction, ProcessingStatus, TransactionUpdateArgs } from '@models/transaction/transaction';
import { TransactionReadArg, SortOrder } from '@models/transaction/TransactionReadArgs';
import {
    TransacitonPersistenceController,
    transactionDatabaseController,
} from '@controllers/data-controller/transaction/TransacitonPersistenceController';
import { GuidFull } from '@utils/generateGuid';
import { chaseTransactionParser } from '@controllers/data-controller/chase/ChaseTransactionFileDataController';
import { ChaseTransaction } from '@models/transaction/chase/ChaseTransaction';
import moment = require('moment');
import businessesController, { BusinessesController } from '@controllers/business-controller';
import { TransactionDeleteArgs } from '@routes/request-types/TransactionRequests';
import { DatabaseError } from '@models/errors/errors';
import {
    validateTransactionCreateArgs,
    validateTransactionUpdateArgs,
} from '@controllers/data-controller/transaction/helper';
import { TransactionImportResult } from './TransactionImportResult';
import { Business } from '@root/src/models/business/Business';

  export const strip = (str: string): string => {
    const stripSymbol = `"`;
    if (str.length >= 2) {
      if (str[0] === stripSymbol && str[str.length - 1] === stripSymbol) {
        return str.substr(1, str.length - 2);
      } else {
        return str;
      }
    } else return str;
  }
  
  export const sameDescription = (d1?: string, d1Check?: string, d2?: string, d2Check?: string)  => {
    d1 = d1 || '';
    d2 = d2 || '';
    d1 = strip(d1)
      .replace(',', ' ')
      .replace(/\s+/g, ' ');
    if (d1.startsWith(' ')) {
      d1 = d1.substr(1);
    }
    if (d1.endsWith(' ')) {
      d1 = d1.substr(0, d1.length - 1);
    }
  
    d2 = strip(d2)
      .replace(',', ' ')
      .replace(/\s+/g, ' ');
    if (d2.startsWith(' ')) {
      d2 = d2.substr(1);
    }
    if (d2.endsWith(' ')) {
      d2 = d2.substr(0, d2.length - 1);
    }
  
    if (d1 === d2) {
      return true;
    }
  
    if (d1Check) {
      d1 = d1.replace(` ${d1Check.replace(/\s+/g, ' ')}`, d1Check.replace(/\s+/g, ' '));
    }
  
    if (d2Check) {
      d2 = d2.replace(` ${d2Check.replace(/\s+/g, ' ')}`, d2Check.replace(/\s+/g, ' '));
    }
  
    if (d1.replace(/\s+/g, ' ') === d2.replace(/\s+/g, ' ')) {
      return true;
    }
  
    if (
      d1.replace(/\s+/g, '').startsWith(d2.replace(/\s+/g, '')) ||
      d2.replace(/\s+/g, '').startsWith(d1.replace(/\s+/g, ''))
    ) {
      return true;
    }
  
    return false;
  }
  
  export const sameTransaction = (db: ChaseTransaction, t2: ChaseTransaction) => {
    return (
      db.Amount === t2.Amount &&
      sameDescription(db.Description, db.CheckOrSlip, t2.Description, t2.CheckOrSlip) &&
      moment(db.PostingDate)
        .startOf('day')
        .isSame(moment(t2.PostingDate).startOf('day')) //&&
    );
  };


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

    read(args: TransactionReadArg): Promise<number | Transaction[]> {
        if (!args.accountId && (!args.accountIds || args.accountIds.length === 0)) {
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

    private addTransactions(bulk: Transaction[], accountId: string): Promise<TransactionImportResult> {
        const result: TransactionImportResult = {
            parsed: 0,
            duplicates: 0,
            newTransactions: 0,
            businessRecognized: 0,
            multipleBusinessesMatched: 0,
            unrecognized: 0,
            unposted: 0,
        };

        return this.mergeWithExisting(bulk, accountId)
            .then((merged) => {
                result.parsed = bulk.length;
                bulk = bulk.filter(this.isTransactionPosted);
                result.unposted = result.parsed - bulk.length;
                result.newTransactions = merged.length;
                result.duplicates = result.parsed - result.newTransactions;
                return merged;
            })
            .then((merged) => {
                const transactions = merged.map(async (tr) => {
                    const transPromise: Promise<Transaction> = this.categorize(tr);
                    return transPromise;
                });
                return Promise.all(transactions);
            })
            .then((categorized) => {
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
                return Promise.all(addPromises);
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

    mergeWithExisting(pending: Transaction[], accountId: string): Promise<Transaction[]> {
        const comparisonDepth = 30;
        const pendingPosted = pending.filter((tr) => tr.chaseTransaction.PostingDate !== undefined);

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
                return Promise.resolve(pending);
            }

            // assuming it may take up to 5 days for transaction to post,
            // we will start from a date of the last existing transaction in database, minus 5 days

            // sort pennding transactions by posting date
            pending = pending
                .filter((c) => c.chaseTransaction.PostingDate !== undefined)
                .sort((p1, p2) =>
                    moment(p1.chaseTransaction.PostingDate).isBefore(moment(p2.chaseTransaction.PostingDate)) ? -1 : 1
                );
            if (!pending || pending.length === 0) {
                return Promise.resolve([]);
            }
            const lastTransactionDate = moment(pending[0].chaseTransaction.PostingDate).isBefore(
                moment(lastExistingPosted[0].chaseTransaction.PostingDate)
            )
                ? pending[0].chaseTransaction.PostingDate
                : lastExistingPosted[0].chaseTransaction.PostingDate;
            const beginningDate = moment(lastTransactionDate).subtract(5, 'days');
            const today = moment();

            let toBeAdded: Transaction[] = [];

            for (
                let date = beginningDate;
                date.startOf('day').isSameOrBefore(today.startOf('day'));
                date.add(1, 'day')
            ) {
                const dbRecords = lastExistingPosted.filter((t) =>
                    moment(t.chaseTransaction.PostingDate)
                        .startOf('day')
                        .isSame(date.startOf('day'))
                );
                const pendingRecords = pendingPosted.filter((t) => {
                    const collDate = moment(t.chaseTransaction.PostingDate).startOf('day');

                    const iteratorDate = date.startOf('day');
                    return collDate.isSame(iteratorDate);
                });

                const missingInDb = pendingRecords.filter((penging) => {
                    const shouldBeAdded = !dbRecords.some((db) => {
                        return originalTransactionEquals(db.chaseTransaction, penging.chaseTransaction);
                    });
                    return shouldBeAdded;
                });
                toBeAdded = toBeAdded.concat(missingInDb);
            }
            return Promise.resolve(toBeAdded);
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
            .then((cache) => {
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

export const originalTransactionEquals = (t1: ChaseTransaction, t2: ChaseTransaction) => {
    return (
        t1.Amount === t2.Amount &&
        (t1.Balance || undefined) === (t2.Balance || undefined) &&
        (t1.CheckOrSlip || undefined) === (t2.CheckOrSlip || undefined) &&
        (t1.Description || undefined) === (t2.Description || undefined) &&
        (t1.Details || undefined) === (t2.Details || undefined) &&
        moment(t1.PostingDate).isSame(moment(t2.PostingDate)) &&
        (t1.Type || undefined) === (t2.Type || undefined) &&
        (t1.CreditCardTransactionType || undefined) === (t2.CreditCardTransactionType || undefined) &&
        (t1.BankDefinedCategory || undefined) === (t2.BankDefinedCategory || undefined)
    );
};

export const transactionController = new TransactionController(transactionDatabaseController, businessesController);
