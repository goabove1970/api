import { BaseSpending } from "./BaseSpending";

export interface MonthlyCategorySpending extends BaseSpending {

    parentCategoryId?: string;
    categoryId?: string;
    categoryName?: string;
    month?: Date;
    monthName?: string;
}