import { UserAccount } from '@models/accounts/Account';
import { DeepPartial } from '@models/DeepPartial';
import { ReadAccountArgs } from '@models/accounts/ReadAccountArgs';
import { AccountCreateArgs } from '@models/accounts/AccountCreateArgs';
import { GuidFull } from '@utils/generateGuid';
import { AccountStatus } from '@models/accounts/AccountStatus';
import { AccountUpdateArgs } from '@models/accounts/AccountUpdateArgs';
import { userPersistanceController } from '../users/UserPersistanceController';
import { CONFIG } from '@root/app.config';
import { DatabaseError } from '@root/src/models/errors/errors';

export const toShortAccountDetails = (account: UserAccount): DeepPartial<UserAccount> | undefined => {
    return {
        bankRoutingNumber: account.bankRoutingNumber,
        bankAccountNumber: account.bankAccountNumber,
        bankName: account.bankName,
        status: account.status,
        accountId: account.accountId,
        userId: account.userId,
        accountType: account.accountType,
    };
};

export function matchesReadArgs(args: ReadAccountArgs): string {
    let query = ' AS ac ';

    if (!args) {
        return query;
    }

    const conditions = [];
    if (args.userId) {
        query += ` JOIN ${CONFIG.PgConfig.schema}.user_account AS usac
          ON ac.account_id = usac.account_id
          WHERE (usac.user_id = '${args.userId}')`;
    }

    if (args.accountId) {
        conditions.push(`ac.account_id=${!args.accountId ? 'NULL' : "'" + args.accountId + "'"}`);
    }

    if (args.status) {
        conditions.push(`((ac.status & ${args.status})=${args.status})`);
    }

    const where = args.userId ? 'AND' : 'WHERE';
    const finalSattement = query + (conditions.length > 0 ? `${where} ${conditions.join(' AND ')}` : '');
    return finalSattement;
}

export function validateCreateAccountArgs(args: AccountCreateArgs): Promise<void> {
    if (!args.userId) {
        throw new DatabaseError('User id name can not be empty');
    }

    return userPersistanceController
        .getUserById(args.userId)
        .then((user) => {
            if (!user) {
                throw {
                    message: 'User account with provided id was not found',
                };
            }
        })
        .then(() => {
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
        })
        .catch((error) => {
            throw error;
        });
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

export function validateAccountUpdateArgs(args: AccountUpdateArgs): Promise<void> {
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

    return validateCreateAccountArgs(args);
}
