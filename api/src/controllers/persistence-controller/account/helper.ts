import { UserAccount } from '../../../models/accounts/Account';
import { DeepPartial } from '../../../models/DeepPartial';
import { ReadAccountArgs } from '../../../models/accounts/ReadAccountArgs';
import { AccountCreateArgs } from '../../../models/accounts/AccountCreateArgs';
import { GuidFull } from '../../../utils/generateGuid';
import { AccountStatus } from '../../../models/accounts/AccountStatus';
import { AccountUpdateArgs } from '../../../models/accounts/AccountUpdateArgs';
import { userPersistanceController } from '../users/UserPersistanceController';

export const toShortAccountDetails = (account: UserAccount): DeepPartial<UserAccount> | undefined => {
  return {
    bankRoutingNumber: account.bankRoutingNumber,
    bankAccountNumber: account.bankAccountNumber,
    bankName: account.bankName,
    status: account.status,
    accountId: account.accountId,
    userId: account.userId,
  };
};

export function matchesReadArgs(m: UserAccount, args: ReadAccountArgs): boolean {
  if (!args) {
    return true;
  }

  let matches = true;
  if (args.status && m.status) {
    matches = matches && (m.status & args.status) === args.status;
  }

  if (args.userId && m.userId) {
    matches = m.userId === args.userId;
  }

  if (args.accountId && m.accountId) {
    matches = m.accountId === args.accountId;
  }

  return matches;
}

export function validateCreateAccountArgs(args: AccountCreateArgs): void {
  if (!args.userId) {
    throw {
      message: 'User id name can not be empty',
    };
  }

  const user = userPersistanceController.getUserById(args.userId);
  if (!user) {
    throw {
      message: 'User account with provided id was not found',
    };
  }

  if (!args.bankRoutingNumber) {
    throw {
      message: 'Routing number can not be empty',
    };
  }

  if (!args.bankAccountNumber) {
    throw {
      message: 'Bank account name can not be empty',
    };
  }
}

export const combineNewAccount = (args: AccountCreateArgs): UserAccount => {
  return {
    bankAccountNumber: args.bankAccountNumber,
    accountId: GuidFull(),
    userId: args.userId,
    bankRoutingNumber: args.bankRoutingNumber,
    bankName: args.bankName,
    createDate: new Date(),
    status: AccountStatus.ActivationPending,
  };
};

export function validateAccountUpdateArgs(args: AccountUpdateArgs): void {
  if (!args) {
    throw {
      message: 'Can not update account, no arguments passed',
    };
  }

  if (!args.accountId) {
    throw {
      message: 'Can not update account, no accountId passed',
    };
  }

  validateCreateAccountArgs(args);
}
