import { ResponseBase } from './Requests';

export type SpendingRequestType = 'read';

export interface SpendingRequestArgs {
    userId: string;
    categoryId?: string;
    startDate: Date;
    endDate: Date;
    includeSubcategories?: boolean;
}

export interface SpendingRequest {
    action?: SpendingRequestType;
    args?: SpendingRequestArgs;
}

export interface CategorySpending {
    debit: number;
    credit: number;
    saldo: number;
    name: string;
    categoryId?: string;
    parentCategoryId?: string;
}

export interface SpendingResponse extends ResponseBase {
    action?: SpendingRequestType;
    startDate?: Date;
    endDate?: Date;
    categories?: CategorySpending[];
    subCatgories?: CategorySpending[];
    spendingProgression?: any[];
    spendingsByMonth?: any;
}
