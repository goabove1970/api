import { ResponseBase } from './Requests';
import { Transaction } from '@models/transaction/transaction';

export enum TransactionRequestType {
    ReadTransactions = 'read-transactions',
    ImportTransaction = 'import-transaction',
    ImportTransactionCsvFile = 'import-transaction-csv-file',
    Delete = 'delete',
    TestRegex = 'test-regex',
    TestBusinessRegex = 'test-business-regex',
    Recognize = 'recognize',
    Update = 'update',
}

export type TransactionRequestTypeArgs =
    | ReadTransactionArgs
    | TransactionImportArgs
    | TransactioCsvFileImportArgs
    | TryRegexParseArgs;

export interface TransactionRequest {
    action?: TransactionRequestType;
    args?: TransactionRequestTypeArgs;
}

export interface TransactionResponse extends ResponseBase {
    action?: TransactionRequestType;
}

export type CategorizationType = 'all' | 'uncategorized' | 'categorized';

export interface ReadTransactionArgs {
    transactionId?: string;
    userId?: string;
    accountId?: string;
    startDate?: Date;
    endDate?: Date;
    count?: number;
    countOnly?: boolean;
    offset?: number;
    categorization?: CategorizationType;
    categoryId?: string;
}

export interface UpdateTransactionArgs {
    transactionId?: string;
    categoryId?: string;
    statusModification?: string;
}

export interface TransactionImportArgs {
    transaction?: Transaction;
    accountId?: string;
}

export interface TransactionDeleteArgs {
    transaction?: Transaction;
    accountId?: string;
}

export interface TransactioCsvFileImportArgs {
    file?: string;
    accountId?: string;
}

export interface TryRegexParseArgs {
    regex?: string;
    businessId?: string;
}
