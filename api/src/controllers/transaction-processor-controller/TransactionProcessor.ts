import { Transaction } from '@src/models/transaction/Transaction';

export class TransactionProcessor {
    addTransaction(transaction: Transaction): string {
        return 'some-id';
    }

    updateTransaction(transaction: Transaction) {}

    categorize(transaction: Transaction): string {
        return 'come-id';
    }
}
