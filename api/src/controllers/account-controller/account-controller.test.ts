import { AccountCreateArgs } from "@root/src/models/accounts/AccountCreateArgs";
import { ReadAccountArgs } from "@root/src/models/accounts/ReadAccountArgs";
import { AccountPersistanceController } from "../data-controller/account/AccountPersistanceController";
import { AccountController } from "./account-controller";
import { mockableAccountArgs, MockAccountPersistanceController } from "./MockAccountPersistanceController";

describe('MockAccountController', () => {
    let mockAccountPersistanceController: AccountPersistanceController;
    let mockAccountController: AccountController;

    beforeEach(() => {
        MockAccountPersistanceController.mockClear();
        mockAccountPersistanceController = MockAccountPersistanceController();
        mockAccountController = new AccountController(mockAccountPersistanceController);
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

        const indexOf = mockableAccountArgs.mockAccountCollection.find(acct => acct.accountId === acct_id);
        expect(indexOf).not.toEqual(-1);

        expect(mockableAccountArgs.mockAccountCollection.length).toBeGreaterThan(0);
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
