import { DeepPartial } from '@models/DeepPartial';
import { UserAccount } from '@models/accounts/Account';
import { ReadAccountArgs } from '@models/accounts/ReadAccountArgs';
import { AccountCreateArgs } from '@models/accounts/AccountCreateArgs';
import { AccountUpdateArgs } from '@models/accounts/AccountUpdateArgs';
import { AccountDeleteArgs } from '@models/accounts/AccountDeleteArgs';

export abstract class AccountPersistanceControllerReadonlyBase {
  abstract getAccount(args: ReadAccountArgs): DeepPartial<UserAccount>[];
}

export abstract class AccountPersistanceControllerBase extends AccountPersistanceControllerReadonlyBase {
  abstract createAccount(args: AccountCreateArgs): string;
  abstract updateAccount(args: AccountUpdateArgs);
  abstract deleteAccount(args: AccountDeleteArgs): void;
}
