import { ResponseBase } from './Requests';
import { Transaction } from '@root/src/models/transaction/Transaction';

export enum TransactionRequestType {
    ReadTransactions = 'read-transactions',
    ImportTransaction = 'import-transaction',
    ImportTransactionCsvFile = 'import-transaction-csv-file',
}

export interface TransactionRequest {
    action?: TransactionRequestType;
    args?: ReadTransactionArgs | TransactionImportArgs | TransactioCsvFileImportArgs;
}

export interface TransactionResponse extends ResponseBase {
    action?: TransactionRequestType;
}

export interface ReadTransactionArgs {
    transactionId?: string;
    userId?: string;
    accountId?: string;
    startDate?: Date;
    endDate?: Date;
    count?: number;
    countOnly?: boolean;
    offset?: number;
}

export interface TransactionImportArgs {
    transaction?: Transaction;
    accountId?: string;
}

export interface TransactioCsvFileImportArgs {
    file?: string;
    accountId?: string;
}
