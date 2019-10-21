export interface TransactionArg {
    transactionId: string;
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    accountId?: string;
    readCount?: number;
}
