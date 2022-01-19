import { Transaction, TransactionStatus } from '@models/transaction/transaction';
import { ChaseTransaction } from '../models/transaction/chase/ChaseTransaction';
import moment = require('moment');

export const isHiddenTransaction = (t: Transaction): boolean => {
    if (!t) {
        return false;
    }
    if (!t.transactionStatus) {
        return false;
    }
    return (t.transactionStatus && t.transactionStatus & TransactionStatus.hidden) != 0 ? true : false;
};

export const isExcludedFromBalanceTransaction = (t: Transaction): boolean => {
    if (!t) {
        return false;
    }
    if (!t.transactionStatus) {
        return false;
    }
    return (t.transactionStatus && t.transactionStatus & TransactionStatus.excludeFromBalance) != 0 ? true : false;
};

export const equalsChase = (t1: ChaseTransaction, t2: ChaseTransaction) => {
    return (
        t1.Amount === t2.Amount &&
        (t1.Balance || undefined) === (t2.Balance || undefined) &&
        (t1.CheckOrSlip || undefined) === (t2.CheckOrSlip || undefined) &&
        (t1.Description || undefined) === (t2.Description || undefined) &&
        (t1.Details || undefined) === (t2.Details || undefined) &&
        moment(t1.PostingDate)
            .startOf('day')
            .isSame(moment(t2.PostingDate).startOf('day')) &&
        (t1.Type || undefined) === (t2.Type || undefined) &&
        (t1.CreditCardTransactionType || undefined) === (t2.CreditCardTransactionType || undefined) //;//&&
    );
};

export const equals = (tt1: Transaction, tt2: Transaction) => {
    const t1 = tt1.chaseTransaction;
    const t2 = tt2.chaseTransaction;
    return equalsChase(t1, t2);
};

export const getSame = (source: Transaction[], orig: Transaction) => {
    return source.filter((t) => equals(t, orig));
};

// This function searches for original transaction
// in both present store (database storage) and
// toBeAdded -- transactions to be added
// Needed to avoid double-adding
export const getSameConcat = (presentStore: Transaction[], toBeAdded: Transaction[], orig: Transaction) => {
    const concatenated: Transaction[] = [...presentStore, ...toBeAdded];
    return getSame(concatenated, orig);
};
