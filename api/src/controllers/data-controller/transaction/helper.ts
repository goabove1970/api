import { DatabaseError } from '@models/errors/errors';
import { Transaction } from '@models/transaction/transaction';

export function validateTransactionUpdateArgs(args: Transaction): void {
    if (!args) {
        throw new DatabaseError('Can not update transaction, no arguments passed');
    }

    if (!args.transactionId) {
        throw new DatabaseError('Can not update transaction, no transactionId passed');
    }
}

export function validateTransactionCreateArgs(args: Transaction): void {
    if (!args) {
        throw new DatabaseError('Can not update transaction, no arguments passed');
    }

    if (!args.transactionId) {
        throw new DatabaseError('Can not update transaction, no transactionId passed');
    }
}
