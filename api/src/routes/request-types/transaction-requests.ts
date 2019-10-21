export type TransactionRequestType = 'read-transactions';

export interface TransactionRequest {
    action?: TransactionRequestType;
    args?: ReadTransactionArgs;
}

export interface TransactionResponse {
    action?: TransactionRequestType;
    payload?: {};
}

export interface ReadTransactionArgs {
    transactionId?: string;
    userId?: string;
    accountId?: string;
    startDate?: Date;
    endDate?: Date;
    count?: number;
    offset?: number;
}