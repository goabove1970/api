import { BaseSpending } from "./BaseSpending";

export interface CategorySpending extends BaseSpending {
    name: string;
    categoryId?: string;
    parentCategoryId?: string;
}
