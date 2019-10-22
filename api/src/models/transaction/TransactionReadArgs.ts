export interface TransactionReadArg {
    transactionId?: string;
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    accountId?: string;
    readCount?: number;
}
