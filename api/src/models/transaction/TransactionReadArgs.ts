export interface TransactionReadArg {
    transactionId?: string;
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    accountId?: string;
    readCount?: number;
    offset?: number;
    order?: SortOrder;
    countOnly?: boolean;
}

export enum SortOrder {
    accending,
    descending,
}
