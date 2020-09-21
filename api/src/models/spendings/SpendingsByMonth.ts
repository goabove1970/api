import { MonthlyCategorySpending } from "./MonthlyCategorySpending";

export interface SpendingsByMonth {
    parents: MonthlyCategorySpending[];
    subs: MonthlyCategorySpending[];
}
