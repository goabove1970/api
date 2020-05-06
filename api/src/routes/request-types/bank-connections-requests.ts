import { ResponseBase } from './Requests';

export enum BankSyncRequestType {
    AddBankConnection = 'add-bank-connection',
    RemoveBankConnection = 'remove-bank-connection',
    UpdateBankConnection = 'update-bank-connection',
    GetBankConnections = 'get-bank-connections',
    Synchonize = 'sync',
}

export interface BankSyncRequest {
    action?: BankSyncRequestType;
    args?: BankSyncArgs;
}

export interface BankConnectionResponse extends ResponseBase {
    action?: BankSyncRequestType;
}

export interface BankConnectionStats {
    syncSessionId?: string;
    bankConnectionId?: string;
    userId?: string;
    accounts?: BankAccountPollStatus[];
    bankConnectionError?: string;
    bankConnectionErrorCode?: number;
}

export interface BankAccountPollStatus {
    accountNumber?: string;
    syncStarted?: Date;
    syncCompleted?: Date;
    recordsPolled?: number;
    bankConnectionError?: string;
    bankConnectionErrorCode?: number;
    accountData?: AccountData;
    syncData?: TransactionImprtResult;
}

export interface TransactionImprtResult {
    parsed: number;
    duplicates: number;
    newTransactions: number;
    businessRecognized: number;
    multipleBusinessesMatched: number;
    unrecognized: number;
    unposted: number;
}

export interface AccountData {
    transactions: ofxTransaction[];
    transactionsCount: number;
}

export type ofxTransaction = ofxCreditTransaction & ofxDebitTransaction;

export interface ofxDebitTransaction {
    memo?: string;
}

export interface ofxCreditTransaction {
    transactionType?: string;
    datePosted?: Date;
    amount?: number;
    fitid?: string;
    name?: string;
}

export interface BankSyncArgs {
    connectionId?: string;
    userId?: string;
    bankName?: string;
    login?: string;
    password?: string;
    status?: number;
    lastPollDate?: Date;
    lastPollStats?: BankConnectionStats;
    suspend?: boolean;
}
