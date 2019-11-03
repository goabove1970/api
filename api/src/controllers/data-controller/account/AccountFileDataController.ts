import { FileController } from '../FileController';
import { CachedDataController } from '../CachedDataController';
import { UserAccount } from '@models/accounts/Account';
import { AccountParser } from '@controllers/parser-controller/account/AccountParser';

export class AccountFileDataController extends FileController<UserAccount> {
  constructor(filename: string) {
    super(filename, new AccountParser());
  }
}

export const accountFileDataController: CachedDataController<UserAccount> = new AccountFileDataController('accounts.csv');
