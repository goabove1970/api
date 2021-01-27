import { AccountCreateArgs } from '@models/accounts/AccountCreateArgs';
import { ReadAccountArgs } from '@models/accounts/ReadAccountArgs';
import { AccountPersistenceController } from '@controllers/data-controller/account/AccountPersistenceController';
import { AccountController } from '@controllers/account-controller/account-controller';
import { mockableAccountArgs, MockAccountPersistenceController } from '@mock/MockAccountPersistenceController';
import { ValidationError } from '@models/errors/errors';

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
});
