import { AccountStatus } from './AccountStatus';

export interface UserAccount {
    accountId?: string;
    userId?: string;
    bankRoutingNumber?: number;
    bankAccountNumber?: number;
    bankName?: string;
    createDate?: Date;
    status?: AccountStatus;
    serviceComment?: string;
    accountType?: AccountType;
}
export enum AccountType {
    Credit = 1,
    Debit = 2,
    Checking = 4,
    Savings = 8,
}
