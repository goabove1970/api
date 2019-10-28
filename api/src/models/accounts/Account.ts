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
}
