import { UserAccount } from '@models/accounts/Account';
import { ReadAccountArgs } from '@models/accounts/ReadAccountArgs';
import { AccountCreateArgs } from '@models/accounts/AccountCreateArgs';
import { GuidFull } from '@utils/generateGuid';
import { AccountStatus } from '@models/accounts/AccountStatus';
import { AccountUpdateArgs } from '@models/accounts/AccountUpdateArgs';
import { CONFIG } from '@root/app.config';
import {
    isAccountActive,
    isAccountDeactiveted,
    isAccountLocked,
    isAccountActivationPending,
    isSavings,
    isDebit,
    isCredit,
    isCheching,
} from '@utils/accountUtils';
import { ValidationError } from '@models/errors/errors';

export interface AccountResponseModel extends UserAccount {
    isAccountActive?: boolean;
    isAccountDeactiveted?: boolean;
    isAccountLocked?: boolean;
    isAccountActivationPending?: boolean;
    isSavings?: boolean;
    isDebit?: boolean;
    isCredit?: boolean;
    isCheching?: boolean;
}

export const toShortAccountDetails = (account: UserAccount): AccountResponseModel | undefined => {
    return {
        bankRoutingNumber: account.bankRoutingNumber,
        bankAccountNumber: account.bankAccountNumber,
        bankName: account.bankName,
        status: account.status,
        accountId: account.accountId,
        userId: account.userId,
        accountType: account.accountType,
        cardExpiration: account.cardExpiration,
        cardNumber: account.cardNumber,
        alias: account.alias,
        createDate: account.createDate,
        serviceComment: account.serviceComment,
        isAccountActive: isAccountActive(account),
        isAccountDeactiveted: isAccountDeactiveted(account),
        isAccountLocked: isAccountLocked(account),
        isAccountActivationPending: isAccountActivationPending(account),
        isSavings: isSavings(account),
        isDebit: isDebit(account),
        isCredit: isCredit(account),
        isCheching: isCheching(account),
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

export function validateCreateAccountArgs(args: AccountCreateArgs): void {
    if (!args.bankRoutingNumber) {
        throw new ValidationError('Routing number can not be empty');
    }

    if (!args.bankAccountNumber) {
        throw new ValidationError('Bank account name can not be empty');
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
        status: AccountStatus.Active,
        alias: args.alias,
        accountType: args.accountType,
        serviceComment: JSON.stringify(args.serviceComment) 
    };
};

export function validateAccountUpdateArgs(args: AccountUpdateArgs): Promise<void> {
    if (!args) {
        throw new ValidationError('Can not update account, no arguments passed');
    }
    if (!args.accountId) {
        throw new ValidationError('Can not update account, no accountId passed');
    }

    return Promise.resolve();

    //return validateCreateAccountArgs(args);
}
