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
import { validateTransactionCreateArgs, validateTransactionUpdateArgs } from '@controllers/data-controller/transaction/helper';
import { TransactionImprtResult } from '@routes/request-types/bank-connections-requests';

export class TransactionController {
    dataController: TransacitonPersistenceController;
    businessesController: BusinessesController;

    constructor(dataController: TransacitonPersistenceController,
        businessesController: BusinessesController) {

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

        return this.categorize(newTransaction)
            .then((tr) => {
                validateTransactionCreateArgs(tr);
                this.dataController.add(tr);
                return tr.transactionId;
            })
            .catch((err) => {
                throw err;
            });
    }

    async addTransaction(transaction: Transaction, accountId: string): Promise<TransactionImprtResult> {
        return await this.addTransactions([transaction], accountId);
    }

    async importTransactionsFromCsv(transactionsCsv: string, accountId: string): Promise<TransactionImprtResult> {
        const chaseTransactions = chaseTransactionParser.parseFile(transactionsCsv);
        const pending = chaseTransactions.map((tr) => {
            return {
                chaseTransaction: {
                    ...tr,
                },
            } as Transaction;
        });
        return await this.addTransactions(pending, accountId);
    }

    private async addTransactions(bulk: Transaction[], accountId: string): Promise<TransactionImprtResult> {
        const result: TransactionImprtResult = {
            parsed: 0,
            duplicates: 0,
            newTransactions: 0,
            businessRecognized: 0,
            multipleBusinessesMatched: 0,
            unrecognized: 0,
            unposted: 0,
        };

        const merged = await this.mergeWithExisting(bulk, accountId);
        result.parsed = bulk.length;
        bulk = bulk.filter(this.isTransactionPosted);
        result.unposted = result.parsed - bulk.length;
        result.newTransactions = merged.length;
        result.duplicates = result.parsed - result.newTransactions;
        const transactions = await merged.map(async (tr) => {
            const trans: Transaction = await this.categorize(tr);
            return trans;
        });
        const categorized = await Promise.all(transactions);

        result.businessRecognized = categorized.filter(
            (tr) => tr.processingStatus & ProcessingStatus.merchantRecognized
        ).length;
        result.multipleBusinessesMatched = categorized.filter(
            (tr) => tr.processingStatus & ProcessingStatus.multipleBusinessesMatched
        ).length;
        result.unrecognized = categorized.filter(
            (tr) => tr.processingStatus & ProcessingStatus.merchantUnrecognized
        ).length;

        await transactions.forEach(async (tr) => await this.addTransactionImpl(await tr, accountId));
        return result;
    }

    isTransactionPosted(trans: Transaction): boolean {
        return trans.chaseTransaction.PostingDate !== undefined;
    }

    async mergeWithExisting(pending: Transaction[], accountId: string): Promise<Transaction[]> {
        const comparisonDepth = 30;

        const pendingPosted = pending.filter((tr) => tr.chaseTransaction.PostingDate !== undefined);

        // from DB: posted transactions sorted by date descending
        const lastExistingPosted = ((await this.dataController.read({
            accountId,
            order: SortOrder.descending,
            readCount: comparisonDepth,
        })) as Transaction[]).filter((tr) => tr.chaseTransaction.PostingDate !== undefined);

        // if there are no transactions in database, return all pending transactions
        if (lastExistingPosted.length === 0) {
            return pending;
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
            return [];
        }
        const lastTransactionDate = moment(pending[0].chaseTransaction.PostingDate).isBefore(
            moment(lastExistingPosted[0].chaseTransaction.PostingDate)
        )
            ? pending[0].chaseTransaction.PostingDate
            : lastExistingPosted[0].chaseTransaction.PostingDate;
        const beginningDate = moment(lastTransactionDate).subtract(5, 'days');
        const today = moment();

        let toBeAdded: Transaction[] = [];

        for (let date = beginningDate; date.startOf('day').isSameOrBefore(today.startOf('day')); date.add(1, 'day')) {
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

        return toBeAdded;
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

    async recognize(): Promise<Transaction[]> {
        const unrecognized = ((await this.dataController.read({})) as Transaction[]).filter(
            (tr) => tr.chaseTransaction.PostingDate !== null && tr.businessId === null
        );

        const recognized: Transaction[] = [];

        const business = await this.businessesController.read({});
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
                    tr.processingStatus & ProcessingStatus.merchantRecognized & ProcessingStatus.merchantUnrecognized,
            })
        );

        return recognized;
    }

    async assignBusinessMatchingTransactions(rgx: string): Promise<Transaction[]> {
        const unrecognized = ((await this.dataController.read({})) as Transaction[]).filter(
            (tr) => tr.chaseTransaction.PostingDate !== undefined && tr.businessId === undefined
        );

        const regex = RegExp(rgx, 'g');

        const matches = unrecognized.filter((transaction) => {
            return regex.test(transaction.chaseTransaction.Description);
        });

        return matches;
    }

    async categorize(transaction: Transaction): Promise<Transaction> {
        const cache = await this.businessesController.getCache();
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
            transaction.processingStatus = transaction.processingStatus ^ ProcessingStatus.multipleBusinessesMatched;
        } else {
            transaction.processingStatus = transaction.processingStatus ^ ProcessingStatus.merchantUnrecognized;
        }

        return transaction;
    }
}

export function originalTransactionEquals(t1: ChaseTransaction, t2: ChaseTransaction) {
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
}

export const transactionController = new TransactionController(transactionDatabaseController, businessesController);
