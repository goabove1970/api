import { AccountStatus } from './AccountStatus';
import { AccountType } from './Account';
export interface AccountUpdateArgs {
    accountId?: string;
    userId?: string;
    bankRoutingNumber?: number;
    bankAccountNumber?: number;
    bankName?: string;
    status?: AccountStatus;
    accountType?: AccountType;
    forceUpdate?: boolean;
    cardNumber?: string;
    cardExpiration?: Date;
    alias?: string;
    serviceComment?: string;
}
