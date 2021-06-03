import { CategorySpending } from "./CategorySpending";

export interface MonthlyCategorySpending extends CategorySpending {
    month?: Date;
    monthName?: string;
  }
  