import { ResponseBase } from './Requests';
import { Transaction } from '@models/transaction/transaction';
import { TransactionReadArg } from '@root/src/models/transaction/TransactionReadArgs';

export enum TransactionRequestType {
    ReadTransactions = 'read-transactions',
    ImportTransaction = 'import-transaction',
    ImportTransactions = 'import-transactions',
    ImportTransactionCsvFile = 'import-transaction-csv-file',
    Delete = 'delete',
    DeleteTransactions = 'delete-transactions',
    TestRegex = 'test-regex',
    TestBusinessRegex = 'test-business-regex',
    Recognize = 'recognize',
    Update = 'update',
}

export type TransactionRequestTypeArgs =
    | TransactionReadArg
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

export interface UpdateTransactionArgs {
    transactionId?: string;
    categoryId?: string;
    statusModification?: string;
}

export interface TransactionImportArgs {
    transaction?: Transaction;
    accountId?: string;
}

export interface TransactionsImportArgs {
    transactions?: Transaction[];
    accountId?: string;
}

export interface TransactionsDeleteArgs {
    transactionIds?: [];
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
