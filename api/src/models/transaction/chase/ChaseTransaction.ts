import { ChaseTransactionOriginType } from './ChaseTransactionOriginType';
import { ChaseTransactionType } from './ChaseTransactionType';

export interface ChaseTransaction {
    TransactionId?: string;
    Details: ChaseTransactionOriginType;
    PostingDate: Date;
    Description: string;
    Amount?: number;
    Type?: ChaseTransactionType;
    Balance?: number;
    CheckOrSlip?: string;
}
