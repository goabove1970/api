import { ResponseBase } from './Requests';
import { MonthlyBalance } from '@models/spendings/MonthlyBalance';
import { SpendingProgressionItem } from '@models/spendings/SpendingProgressionItem';
import { CategorySpending } from '@models/spendings/CategorySpending';
import { SpendingsByMonth } from '@models/spendings/SpendingsByMonth';

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

export interface SpendingResponse extends ResponseBase {
    action?: SpendingRequestType;
    startDate?: Date;
    endDate?: Date;
    categories?: CategorySpending[];
    subCatgories?: CategorySpending[];
    spendingProgression?: SpendingProgressionItem[];
    spendingsByMonth?: SpendingsByMonth;
    annualBalances?: MonthlyBalance[];
}
