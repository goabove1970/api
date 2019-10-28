import { AccountStatus } from 'src/models/accounts/AccountStatus';
export interface ReadAccountArgs {
  userId?: string;
  status?: AccountStatus;
  accountId?: string;
}
