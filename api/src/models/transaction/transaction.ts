import { ChaseTransaction } from './chase/ChaseTransaction'

export interface Transaction {
    AccountId?: string;
    UserId?: string;
    TransactionId?: string;
    transactionOrigin?: ChaseTransaction;
    importedDate?: Date;
}