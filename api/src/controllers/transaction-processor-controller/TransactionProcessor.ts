import { Transaction, ProcessingStatus } from '@src/models/transaction/Transaction';
import { TransactionReadArg, SortOrder } from '@root/src/models/transaction/TransactionReadArgs';
import { transactionDatabaseController as transController } from '../data-controller/transaction/TransacitonPersistenceController';
import { GuidFull } from '@root/src/utils/generateGuid';
import { chaseTransactionParser } from '../data-controller/chase/ChaseTransactionFileDataController';
import { ChaseTransaction } from '@root/src/models/transaction/chase/ChaseTransaction';
import moment = require('moment');

export class TransactionProcessor {
    update(args: Transaction): Promise<void> {
        return transController.delete(args);
    }

    delete(args: TransactionReadArg): Promise<void> {
        return transController.delete(args);
    }

    read(args: TransactionReadArg): Promise<number | Transaction[]> {
        return transController.read(args);
    }

    async addTransaction(transaction: Transaction, accountId: string): Promise<string> {
        const newTransaction: Transaction = {
            ...transaction,
            accountId: accountId || transaction.accountId,
            transactionId: GuidFull(),
            processingStatus: ProcessingStatus.unprocessed,
        };
        await transController.add(newTransaction);
        return newTransaction.transactionId;
    }

    async importTransactionsFromCsv(transactionsCsv: string, accountId: string): Promise<number> {
        const chaseTransactios = chaseTransactionParser.parseFile(transactionsCsv);
        const pending = chaseTransactios
            .map((tr) => {
                return {
                    chaseTransaction: {
                        ...tr,
                    },
                } as Transaction;
            })
            .filter(this.isTransactionPosted);
        const merged = await this.mergeWithExisting(pending, accountId);

        await merged.forEach(async (tr) => await this.addTransaction(tr, accountId));
        return merged.length;
    }

    isTransactionPosted(trans: Transaction): boolean {
        return trans.chaseTransaction.PostingDate !== undefined;
    }

    async mergeWithExisting(pending: Transaction[], accountId: string): Promise<Transaction[]> {
        const comparisonDepth = 30;

        const pendingPosted = pending.filter((tr) => tr.chaseTransaction.PostingDate !== undefined);

        // from DB: posted transactions sorted by date descending
        const lastExistingPosted = ((await transController.read({
            accountId,
            order: SortOrder.descending,
            readCount: comparisonDepth,
        })) as Transaction[]).filter((tr) => tr.chaseTransaction.PostingDate !== undefined);

        // if there are no transactions in database, return all pending transactions
        if (lastExistingPosted.length === 0) {
            return pending;
        }

        // assuming it may take up to 5 days for transaction to post,
        // we will start from a date of the last existing transaction in database, minues 5 days

        const lastTransactionDate = lastExistingPosted[0].chaseTransaction.PostingDate;
        const beginningDate = new Date(lastTransactionDate);
        beginningDate.setDate(beginningDate.getDate() - 5);
        const today = new Date();

        let toBeAdded: Transaction[] = [];

        for (let date = new Date(beginningDate); date <= today; date.setDate(date.getDate() + 1)) {
            const dbRecords = lastExistingPosted.filter((t) =>
                moment(t.chaseTransaction.PostingDate)
                    .startOf('day')
                    .isSame(moment(date).startOf('day'))
            );
            const pendingRecords = pendingPosted.filter((t) => {
                const collDate = moment(t.chaseTransaction.PostingDate).startOf('day');

                const iteratorDate = moment(date).startOf('day');
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

    categorize(transaction: Transaction): Transaction {
        // TODO: add categorizing logic here
        return transaction;
    }
}

export function originalTransactionEquals(t1: ChaseTransaction, t2: ChaseTransaction) {
    return (
        t1.Amount === t2.Amount &&
        t1.Balance === t2.Balance &&
        (t1.CheckOrSlip || undefined) === (t2.CheckOrSlip || undefined) &&
        (t1.Description || undefined) === (t2.Description || undefined) &&
        (t1.Details || undefined) === (t2.Details || undefined) &&
        moment(t1.PostingDate).isSame(moment(t2.PostingDate)) &&
        (t1.Type || undefined) === (t2.Type || undefined)
    );
}

export const transactionProcessor = new TransactionProcessor();
