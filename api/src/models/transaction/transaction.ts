import { ChaseTransaction } from './chase/ChaseTransaction';

export interface Transaction extends ChaseTransaction {
    accountId?: string;
    transactionId?: string;
    importedDate?: Date;
    categoryId?: string;
    userComment?: string;
    overridePostingDate?: Date;
    overrideDescription?: string;
    serviceType?: TransactionServiceType;
    overrideCategory?: string;
    transactionStatus?: TransactionStatus;
}

export enum TransactionServiceType {
    paidCreditCard = 1,
}

export enum TransactionStatus {
    excludeFromBalance = 1,
    recurring = 2,
}
