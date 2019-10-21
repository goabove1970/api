import { TransactionOriginType } from "./transaction-origin-type";
import { TransactionType } from "./transaction-type";

export interface Transaction {
    AccountId?: string;
    UserId?: string;

    TransactionId?: string;
    Details: TransactionOriginType;
    PostingDate: Date;
    Description: string;
    Amount?: number;
    Type?: TransactionType;
    Balance?: number;
    CheckOrSlip?: string;
}