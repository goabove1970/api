import { Transaction, TransactionStatus } from '@models/transaction/transaction';

export const isHiddenTransaction = (t: Transaction): boolean => {
    if (!t) {
        return false;
    }
    return (t.transactionStatus & TransactionStatus.hidden) != 0 ? true : false;
};

export const isExcludedFromBalanceTransaction = (t: Transaction): boolean => {
    if (!t) {
        return false;
    }
    return (t.transactionStatus & TransactionStatus.excludeFromBalance) != 0 ? true : false;
};
