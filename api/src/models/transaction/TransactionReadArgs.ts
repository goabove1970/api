import { CategorizationType } from '@routes/request-types/TransactionRequests';

export interface TransactionReadArg {
    filter?: string;
    transactionId?: string;
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    accountId?: string;
    categoryId?: string;
    accountIds?: string[];
    readCount?: number;
    offset?: number;
    order?: SortOrder;
    countOnly?: boolean;
    categorization?: CategorizationType;
}

export enum SortOrder {
    accending,
    descending,
}
