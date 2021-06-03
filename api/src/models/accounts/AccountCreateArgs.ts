import { AccountType } from "./Account";

export interface AccountCreateArgs {
    userId?: string;
    bankRoutingNumber?: string;
    bankAccountNumber?: string;
    bankName?: string;
    alias?: string;
    accountType?: AccountType;
    serviceComment?: string;
}
