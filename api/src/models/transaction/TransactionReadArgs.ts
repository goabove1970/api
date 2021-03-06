import { CategorizationType } from '@routes/request-types/TransactionRequests';

export interface TransactionReadArg {
    transactionId?: string;
    startDate?: Date;
    endDate?: Date;
    accountId?: string;
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
