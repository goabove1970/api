import { DeepPartial } from '@models/DeepPartial';
import { UserAccount } from '@models/accounts/Account';
import { ReadAccountArgs } from '@models/accounts/ReadAccountArgs';
import { AccountCreateArgs } from '@models/accounts/AccountCreateArgs';
import { AccountUpdateArgs } from '@models/accounts/AccountUpdateArgs';
import { AccountDeleteArgs } from '@models/accounts/AccountDeleteArgs';

export abstract class AccountPersistenceControllerReadonlyBase {
    abstract read(args: ReadAccountArgs): Promise<DeepPartial<UserAccount>[]>;

    getUserAccounts(userId?: string): Promise<DeepPartial<UserAccount[]>> {
        const args: ReadAccountArgs = {
            userId,
        };
        return this.read(args);
    }

    async getMap(userId?: string): Promise<Map<string, UserAccount>> {
        const accounts = await this.getUserAccounts(userId);
        const accountsMap = new Map<string, UserAccount>();
        accounts.forEach((c) => {
            const existing = accountsMap.has(c.accountId);
            if (!existing) {
                accountsMap.set(c.accountId, c);
            }
        });
        return accountsMap;
    }
}

export abstract class AccountPersistenceControllerBase extends AccountPersistenceControllerReadonlyBase {
    abstract create(args: AccountCreateArgs): Promise<string>;
    abstract update(args: AccountUpdateArgs): Promise<void>;
    abstract delete(args: AccountDeleteArgs): Promise<void>;
}
