import { BaseSpending } from "./BaseSpending";

export interface CategorySpending extends BaseSpending {
    parentCategoryId?: string;
    categoryId?: string;
    categoryName?: string;
    name?: string;
  }
