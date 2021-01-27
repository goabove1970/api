import { Transaction } from '@models/transaction/transaction';
import { ValidationError } from '@models/errors/errors';

export function validateTransactionUpdateArgs(args: Transaction): void {
    if (!args) {
        throw new ValidationError('Can not update transaction, no arguments passed');
    }

    if (!args.transactionId) {
        throw new ValidationError('Can not update transaction, no transactionId passed');
    }
}

export function validateTransactionCreateArgs(args: Transaction): void {
    if (!args) {
        throw new ValidationError('Can not update transaction, no arguments passed');
    }

    if (!args.transactionId) {
        throw new ValidationError('Can not update transaction, no transactionId passed');
    }
}
