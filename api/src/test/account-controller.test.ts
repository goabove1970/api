import { AccountCreateArgs } from '@models/accounts/AccountCreateArgs';
import { ReadAccountArgs } from '@models/accounts/ReadAccountArgs';
import { AccountDeleteArgs } from '@models/accounts/AccountDeleteArgs';
import { AccountController } from '@controllers/account-controller/account-controller';
import { mockableAccountArgs, MockAccountPersistenceController } from '@mock/MockAccountPersistenceController';
import { ValidationError } from '@models/errors/errors';
import { AccountPersistenceController } from '../controllers/data-controller/account/account-persistance-controller/account-persistance-controller';

describe('AccountController', () => {
    let mockAccountPersistenceController: AccountPersistenceController;
    let mockAccountController: AccountController;

    beforeEach(() => {
        MockAccountPersistenceController.mockClear();
        mockAccountPersistenceController = MockAccountPersistenceController();
        mockAccountController = new AccountController(mockAccountPersistenceController);
    });

    it(`should create account`, async () => {
        const createAccountArgs: AccountCreateArgs = {
            bankAccountNumber: 'acc_num',
            bankName: 'bank_name',
            userId: 'user_id',
            bankRoutingNumber: 'bank_routing',
        };

        mockableAccountArgs.mockAccountCollection = [];

        const acct_id = await mockAccountController.create(createAccountArgs);
        expect(acct_id).not.toBeNull();
        expect(acct_id.length).toBeGreaterThan(0);

        const indexOf = mockableAccountArgs.mockAccountCollection.find((acct) => acct.accountId === acct_id);
        expect(indexOf).not.toEqual(-1);

        expect(mockableAccountArgs.mockAccountCollection.length).toBeGreaterThan(0);
    });

    it(`should throw creating account with empty bankRoutingNumber`, async () => {
        const createAccountArgs: AccountCreateArgs = {
            bankAccountNumber: 'acc_num',
            bankName: 'bank_name',
            userId: 'user_id',
        };
        mockableAccountArgs.mockAccountCollection = [];
        let thrown = false;
        try {
            await mockAccountController.create(createAccountArgs);
        } catch (error) {
            thrown = true;
            expect(error).toEqual(new ValidationError('Routing number can not be empty'));
        }
        expect(thrown).toBeTruthy();
    });
    
    it(`should throw creating account with empty bank account`, async () => {
        const createAccountArgs: AccountCreateArgs = {
            bankName: 'bank_name',
            userId: 'user_id',
            bankRoutingNumber: 'bank_routing',
        };
        mockableAccountArgs.mockAccountCollection = [];
        let thrown = false;
        try {
            await mockAccountController.create(createAccountArgs);
        } catch (error) {
            thrown = true;
            expect(error).toEqual(new ValidationError('Bank account name can not be empty'));
        }
        expect(thrown).toBeTruthy();
    });

    it(`should read by account id`, async () => {
        const createAccountArgs: AccountCreateArgs = {
            bankAccountNumber: 'acc_num',
            bankName: 'bank_name',
            userId: 'user_id',
            bankRoutingNumber: 'bank_routing',
        };
        mockableAccountArgs.mockAccountCollection = [];

        const acct_id = await mockAccountController.create(createAccountArgs);
        const readAccountArgs: ReadAccountArgs = {
            accountId: acct_id,
        };
        const user = mockAccountController.read(readAccountArgs);
        expect(user).not.toBeNull();
    });

    it(`should read by user id`, async () => {
        const createAccountArgs: AccountCreateArgs = {
            bankAccountNumber: 'acc_num',
            bankName: 'bank_name',
            userId: 'user_id',
            bankRoutingNumber: 'bank_routing',
        };
        mockableAccountArgs.mockAccountCollection = [];

        await mockAccountController.create(createAccountArgs);
        const readAccountArgs: ReadAccountArgs = {
            userId: createAccountArgs.userId,
        };
        const user = mockAccountController.read(readAccountArgs);
        expect(user).not.toBeNull();
    });

    it(`should soft delete account (deactivate)`, async () => {
        const createAccountArgs: AccountCreateArgs = {
            bankAccountNumber: 'acc_num',
            bankName: 'bank_name',
            userId: 'user_id',
            bankRoutingNumber: 'bank_routing',
        };
        mockableAccountArgs.mockAccountCollection = [];

        const accountId = await mockAccountController.create(createAccountArgs);
        expect(mockableAccountArgs.mockAccountCollection.length).toBe(1);

        const deleteArgs: AccountDeleteArgs = {
            accountId,
            serviceComment: 'Account closed by user',
            deleteRecord: false,
        };

        await mockAccountController.delete(deleteArgs);
        
        // Account should still exist but be deactivated
        expect(mockableAccountArgs.mockAccountCollection.length).toBe(1);
        const account = mockableAccountArgs.mockAccountCollection.find((a) => a.accountId === accountId);
        expect(account).toBeDefined();
        expect(account.serviceComment).toContain('Account closed by user');
    });

    it(`should hard delete account (remove from database)`, async () => {
        const createAccountArgs: AccountCreateArgs = {
            bankAccountNumber: 'acc_num',
            bankName: 'bank_name',
            userId: 'user_id',
            bankRoutingNumber: 'bank_routing',
        };
        mockableAccountArgs.mockAccountCollection = [];

        const accountId = await mockAccountController.create(createAccountArgs);
        expect(mockableAccountArgs.mockAccountCollection.length).toBe(1);

        const deleteArgs: AccountDeleteArgs = {
            accountId,
            deleteRecord: true,
        };

        await mockAccountController.delete(deleteArgs);
        
        // Account should be removed from collection
        expect(mockableAccountArgs.mockAccountCollection.length).toBe(0);
        const account = mockableAccountArgs.mockAccountCollection.find((a) => a.accountId === accountId);
        expect(account).toBeUndefined();
    });

    it(`should throw error when deleting non-existent account`, async () => {
        const deleteArgs: AccountDeleteArgs = {
            accountId: 'non-existent-account-id',
            deleteRecord: false,
        };

        let thrown = false;
        try {
            await mockAccountController.delete(deleteArgs);
        } catch (error) {
            thrown = true;
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).toContain('Account not found');
        }
        expect(thrown).toBeTruthy();
    });
});
