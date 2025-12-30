import { UserAccount } from '@models/accounts/Account';
import { AccountCreateArgs } from '@models/accounts/AccountCreateArgs';
import { ReadAccountArgs } from '@models/accounts/ReadAccountArgs';
import { DeepPartial } from '@models/DeepPartial';
import 'jest';
import { combineNewAccount, validateCreateAccountArgs } from '@controllers/data-controller/account/helper';
import { AccountPersistenceController } from '@root/src/controllers/data-controller/account/account-persistance-controller/account-persistance-controller';

export const mockableAccountArgs: { mockAccountCollection: UserAccount[] } = {
    mockAccountCollection: [],
};

const mock_read = jest.fn(
    (args: ReadAccountArgs): Promise<DeepPartial<UserAccount>[]> => {
        let subset = [];
        if (args.accountId) {
            subset = mockableAccountArgs.mockAccountCollection.filter((d) => d.accountId === args.accountId);
        }
        return Promise.resolve(subset);
    }
);

const mock_create = jest.fn(
    (args: AccountCreateArgs): Promise<string> => {
        const account: UserAccount = combineNewAccount(args);
        validateCreateAccountArgs(args);
        mockableAccountArgs.mockAccountCollection.push(account);
        return Promise.resolve(account.accountId);
    }
);
const mock_assignUser = jest.fn();
const mock_update = jest.fn();
const mock_delete = jest.fn(
    (args: { accountId: string; serviceComment?: string; deleteRecord?: boolean }): Promise<void> => {
        const account = mockableAccountArgs.mockAccountCollection.find((a) => a.accountId === args.accountId);
        if (!account) {
            return Promise.reject(new Error(`Account not found. No account exists with ID: ${args.accountId}`));
        }
        if (args.deleteRecord) {
            // Hard delete - remove from collection
            const index = mockableAccountArgs.mockAccountCollection.findIndex((a) => a.accountId === args.accountId);
            if (index > -1) {
                mockableAccountArgs.mockAccountCollection.splice(index, 1);
            }
        } else {
            // Soft delete - deactivate account
            account.status = (account.status || 0) & ~1; // Deactivate (remove active bit)
            if (args.serviceComment) {
                account.serviceComment = (account.serviceComment || '') + `; ${args.serviceComment}`;
            }
        }
        return Promise.resolve();
    }
);

const mock_findAccountImpl = jest.fn(
    (accountId: string): Promise<UserAccount | undefined> => {
        const c = mockableAccountArgs.mockAccountCollection.filter((r) => r.accountId === accountId);
        const res: UserAccount | undefined = c && c.length > 0 ? c[0] : undefined;
        return Promise.resolve(res);
    }
);

const mock_getUserAccounts = jest.fn(
    (userId?: string): Promise<DeepPartial<UserAccount[]>> => {
        const args: ReadAccountArgs = {
            userId,
        };
        return mock_read(args);
    }
);

const mock_getMap = jest.fn(
    async (userId?: string): Promise<Map<string, UserAccount>> => {
        const accounts = await mock_getUserAccounts(userId);
        const accountsMap = new Map<string, UserAccount>();
        accounts.forEach((c) => {
            const existing = accountsMap.has(c.accountId);
            if (!existing) {
                accountsMap.set(c.accountId, c);
            }
        });
        return accountsMap;
    }
);

export let MockAccountPersistenceController = jest.fn<AccountPersistenceController, []>(() => ({
    create: mock_create,
    read: mock_read,
    update: mock_update,
    delete: mock_delete,
    assignUser: mock_assignUser,
    findAccountImpl: mock_findAccountImpl,
    composeSetStatement: jest.fn(),
    getUserAccounts: mock_getUserAccounts,
    getMap: mock_getMap,
    accountDataController: undefined,
}));
