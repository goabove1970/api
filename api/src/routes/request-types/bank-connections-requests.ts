import { TransactionImportResult } from '@root/src/models/transaction/TransactionImportResult';
import { ResponseBase } from './Requests';

export interface BankSyncRequest {
    action?: string;
    args?: BankSyncArgs;
}

export interface BankConnectionResponse extends ResponseBase {
    action?: string;
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
    syncData?: TransactionImportResult;
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
