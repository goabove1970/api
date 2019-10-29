import { AccountPersistanceControllerBase } from './AccountPersistanceControllerBase';
import { DataController } from '@controllers/data-controller/DataController';
import { DeepPartial } from '@models/DeepPartial';
import {
  matchesReadArgs,
  toShortAccountDetails,
  validateCreateAccountArgs,
  combineNewAccount,
  validateAccountUpdateArgs,
} from './helper';
import { UserAccount } from '@models/accounts/Account';
import { ReadAccountArgs } from '@models/accounts/ReadAccountArgs';
import { AccountCreateArgs } from '@models/accounts/AccountCreateArgs';
import { AccountUpdateArgs } from '@models/accounts/AccountUpdateArgs';
import { AccountDeleteArgs } from '@models/accounts/AccountDeleteArgs';
import { accountFileDataController } from '@controllers/data-controller/account/AccountFileDataController';
import { AccountStatus } from '@models/accounts/AccountStatus';

export class AccountPersistanceController implements AccountPersistanceControllerBase {
  private dataController: DataController<UserAccount>;

  constructor(controller: DataController<UserAccount>) {
    this.dataController = controller;
  }

  private checkCache(action?: string) {
    if (!this.dataController || !this.dataController.cache) {
      throw {
        message: action ? `Error while ${action}, ` : '' + ' account cache not initialized',
      };
    }
  }

  private findAccountImpl(accountId: string): UserAccount | undefined {
    this.checkCache('getting account record by id');
    return this.dataController.cache.find((u) => u.accountId === accountId);
  }

  getAccountById(accountId: string): DeepPartial<UserAccount> | undefined {
    this.checkCache('getting account by id');
    const account = this.findAccountImpl(accountId);
    if (account) {
      return toShortAccountDetails(account);
    }
    return undefined;
  }

  getAccount(args: ReadAccountArgs): DeepPartial<UserAccount>[] {
    this.checkCache('getting all account');
    return this.dataController.cache.filter((u) => matchesReadArgs(u, args)).map((u) => toShortAccountDetails(u));
  }

  createAccount(args: AccountCreateArgs): string {
    this.checkCache('creating new account');

    validateCreateAccountArgs(args);
    const generatedUser = combineNewAccount(args);
    this.dataController.cache.push(generatedUser);
    this.dataController.commitAllRecords();
    return generatedUser.accountId;
  }

  updateAccount(args: AccountUpdateArgs): void {
    this.checkCache('updating account record');
    validateAccountUpdateArgs(args);
    const account = this.findAccountImpl(args.accountId);
    if (!account) {
      throw {
        message: 'Error updating account data, could not find account record',
      };
    }
    if (!(account.status & AccountStatus.Active) && !args.forceUpdate) {
      throw {
        message: 'Error updating account data, user bank account is inactive',
      };
    }

    if (args.userId) {
      account.userId = args.userId;
    }
    if (args.bankRoutingNumber) {
      account.bankRoutingNumber = args.bankRoutingNumber;
    }
    if (args.bankAccountNumber) {
      account.bankAccountNumber = args.bankAccountNumber;
    }
    if (args.bankName) {
      account.bankName = args.bankName;
    }
    if (args.status) {
      account.status = args.status;
    }
  }

  deleteAccount(args: AccountDeleteArgs): void {
    this.checkCache('deleting account');

    const { accountId, serviceComment, deleteRecord } = args;
    {
      const account = this.getAccountById(accountId);
      if (account) {
        if (deleteRecord) {
          this.dataController.cache = this.dataController.cache.filter((u) => u.accountId !== accountId);
        } else {
          account.serviceComment = account.serviceComment + `; ${serviceComment}`;
          account.status = account.status & AccountStatus.Deactivated;
        }
        this.dataController.commitAllRecords();
      } else {
        throw {
          message: 'Error deleting account, could not find bank account record',
        };
      }
    }
  }
}

export const accountPersistanceController = new AccountPersistanceController(accountFileDataController);
