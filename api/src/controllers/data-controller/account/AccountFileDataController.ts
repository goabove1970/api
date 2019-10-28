import { FileController } from '../FileController';
import { DataController } from '../DataController';
import { UserAccount } from '../../../models/accounts/Account';
import { AccountParser } from '../../../controllers/parser-controller/account/AccountParser';

export class AccountFileDataController extends FileController<UserAccount> {
  constructor(filename: string) {
    super(filename, new AccountParser());
  }
}

export const accountFileDataController: DataController<UserAccount> = new AccountFileDataController('accounts.csv');
