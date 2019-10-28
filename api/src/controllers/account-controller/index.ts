import { DeepPartial } from '../../models/DeepPartial';
import { ReadAccountArgs } from 'src/models/accounts/ReadAccountArgs';
import { UserAccount } from 'src/models/accounts/Account';
import { AccountCreateArgs } from 'src/models/accounts/AccountCreateArgs';
import { AccountUpdateArgs } from 'src/models/accounts/AccountUpdateArgs';
import { accountPersistanceController } from '../persistence-controller/account/AccountPersistanceController';
import { AccountDeleteArgs } from 'src/models/accounts/AccountDeleteArgs';

export abstract class AccountControllerBase {
  abstract getAccount(args: ReadAccountArgs): DeepPartial<UserAccount>[];

  abstract createAccount(args: AccountCreateArgs): string;
  abstract updateAccount(args: AccountUpdateArgs);
  abstract deleteAccount(args: AccountDeleteArgs): void;
}

export class AccountController implements AccountControllerBase {
  getAccount(args: ReadAccountArgs): DeepPartial<UserAccount>[] {
    return accountPersistanceController.getAccount(args);
  }
  createAccount(args: AccountCreateArgs): string {
    return accountPersistanceController.createAccount(args);
  }
  updateAccount(args: AccountUpdateArgs): void {
    accountPersistanceController.updateAccount(args);
  }
  deleteAccount(args: AccountDeleteArgs): void {
    accountPersistanceController.deleteAccount(args);
  }
}

const accountController: AccountController = new AccountController();
export default accountController;
