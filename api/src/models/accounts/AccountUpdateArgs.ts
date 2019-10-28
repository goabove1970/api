import { AccountStatus } from './AccountStatus';
export interface AccountUpdateArgs {
  accountId?: string;
  userId?: string;
  bankRoutingNumber?: number;
  bankAccountNumber?: number;
  bankName?: string;
  status?: AccountStatus;
  forceUpdate?: boolean;
}
