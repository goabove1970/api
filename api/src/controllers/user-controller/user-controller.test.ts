import { AccountCreateArgs } from '@root/src/models/accounts/AccountCreateArgs';
import { DatabaseError } from '@root/src/models/errors/errors';
import { ManageAccountArgs } from '@root/src/models/user/ManageAccountArgs';
import { UserCreateArgs } from '@root/src/models/user/UserCreateArgs';
import { UserDeleteArgs } from '@root/src/models/user/UserDeleteArgs';
import { UserUpdatePasswordArgs } from '@root/src/models/user/UserUpdatePasswordArgs';
import { UserController } from '.';
import { AccountController } from '../account-controller/account-controller';
import {
    mockableAccountArgs,
    MockAccountPersistanceController,
} from '../account-controller/MockAccountPersistanceController';
import { AccountPersistanceController } from '../data-controller/account/AccountPersistanceController';
import { UserPersistanceController } from '../data-controller/users/UserPersistanceController';
import { mockUserArguments, MockUserPersistanceController } from './MockUserPersistanceController';

describe('MockUserController', () => {
    let mockAccountPersistanceController: AccountPersistanceController;
    let mockAccountController: AccountController;

    let mockUserPersistanceController: UserPersistanceController;
    let mockUserController: UserController;

    beforeEach(() => {
        // 1. Mock AccountPersistanceController
        MockAccountPersistanceController.mockClear();
        mockAccountPersistanceController = MockAccountPersistanceController();
        mockAccountController = new AccountController(mockAccountPersistanceController);

        // 2. Mock UserPersistanceController
        MockUserPersistanceController.mockClear();
        mockUserPersistanceController = MockUserPersistanceController();
        mockUserController = new UserController(mockUserPersistanceController);

        // 3. Init the mock injectible dependencies argument
        mockUserArguments.mockUserAccountLinkCollection = [];
        mockUserArguments.mockUserCollection = [];
        mockUserArguments.mockAccountController = mockAccountController;
    });

    it(`should create user`, async () => {
        const createUserArgs: UserCreateArgs = {
            accountCreated: new Date(2021, 1, 20),
            dob: new Date(1989, 1, 14),
            email: 'goabove1970@gmail.com',
            firstName: 'Ievgen',
            lastName: 'Melnychuk',
            login: 'goabove',
            ssn: 123456789,
            password: 'password',
            lastLogin: new Date(2021, 1, 20),
        };

        mockUserArguments.mockUserCollection = [];

        const userId = await mockUserController.create(createUserArgs);
        expect(userId).not.toBeNull();
        expect(userId.length).toBeGreaterThan(0);

        const indexOf = mockUserArguments.mockUserCollection.find((user) => user.userId === userId);
        expect(indexOf).not.toEqual(-1);
        expect(mockUserArguments.mockUserCollection.length).toBeGreaterThan(0);
    });

    it(`should throw on duplicate login`, async () => {
        const createUserArgs1: UserCreateArgs = {
            accountCreated: new Date(2021, 1, 20),
            dob: new Date(1989, 1, 14),
            email: 'goabove19701@gmail.com',
            firstName: 'Ievgen',
            lastName: 'Melnychuk',
            login: 'goabove',
            ssn: 123456789,
            password: 'password',
            lastLogin: new Date(2021, 1, 20),
        };

        const createUserArgs2: UserCreateArgs = {
            accountCreated: new Date(2021, 1, 20),
            dob: new Date(1989, 1, 14),
            email: 'goabove19702@gmail.com',
            firstName: 'Ievgen',
            lastName: 'Melnychuk',
            login: 'goabove',
            ssn: 123456789,
            password: 'password',
            lastLogin: new Date(2021, 1, 20),
        };

        mockUserArguments.mockUserCollection = [];

        const userId = await mockUserController.create(createUserArgs1);
        expect(userId).not.toBeNull();
        expect(userId.length).toBeGreaterThan(0);
        console.log('inserted the first user');
        expect(() => {
            mockUserController.create(createUserArgs2);
        }).toThrowError(new DatabaseError('User with this login already exists'));
    });

    it(`should throw on duplicate email`, async () => {
        const createUserArgs1: UserCreateArgs = {
            accountCreated: new Date(2021, 1, 20),
            dob: new Date(1989, 1, 14),
            email: 'goabove1970@gmail.com',
            firstName: 'Ievgen',
            lastName: 'Melnychuk',
            login: 'goabove1',
            ssn: 123456789,
            password: 'password',
            lastLogin: new Date(2021, 1, 20),
        };

        const createUserArgs2: UserCreateArgs = {
            accountCreated: new Date(2021, 1, 20),
            dob: new Date(1989, 1, 14),
            email: 'goabove1970@gmail.com',
            firstName: 'Ievgen',
            lastName: 'Melnychuk',
            login: 'goabove2',
            ssn: 123456789,
            password: 'password',
            lastLogin: new Date(2021, 1, 20),
        };

        mockUserArguments.mockUserCollection = [];

        const userId = await mockUserController.create(createUserArgs1);
        expect(userId).not.toBeNull();
        expect(userId.length).toBeGreaterThan(0);
        console.log('inserted the first user');
        expect(() => {
            mockUserController.create(createUserArgs2);
        }).toThrowError(new DatabaseError('User with this email already exists'));
    });

    it(`should read by user id`, async () => {
        const createUserArgs: UserCreateArgs = {
            accountCreated: new Date(2021, 1, 20),
            dob: new Date(1989, 1, 14),
            email: 'goabove1970@gmail.com',
            firstName: 'Ievgen',
            lastName: 'Melnychuk',
            login: 'goabove',
            ssn: 123456789,
            password: 'password',
            lastLogin: new Date(2021, 1, 20),
        };
        mockUserArguments.mockUserCollection = [];

        const userId = await mockUserController.create(createUserArgs);
        const user = await mockUserController.getUserById(userId);
        expect(user).not.toBeNull();
    });

    it(`should read by email`, async () => {
        const createUserArgs: UserCreateArgs = {
            accountCreated: new Date(2021, 1, 20),
            dob: new Date(1989, 1, 14),
            email: 'goabove1970@gmail.com',
            firstName: 'Ievgen',
            lastName: 'Melnychuk',
            login: 'goabove',
            ssn: 123456789,
            password: 'password',
            lastLogin: new Date(2021, 1, 20),
        };
        mockUserArguments.mockUserCollection = [];

        await mockUserController.create(createUserArgs);
        const user = await mockUserController.getUserByEmail(createUserArgs.email);
        expect(user).not.toBeNull();
    });

    describe(`Password manipulations`, async () => {
        it(`should not store original password`, async () => {
            const createUserArgs: UserCreateArgs = {
                accountCreated: new Date(2021, 1, 20),
                dob: new Date(1989, 1, 14),
                email: 'goabove1970@gmail.com',
                firstName: 'Ievgen',
                lastName: 'Melnychuk',
                login: 'goabove',
                ssn: 123456789,
                password: 'password',
                lastLogin: new Date(2021, 1, 20),
            };
            mockUserArguments.mockUserCollection = [];
    
            await mockUserController.create(createUserArgs);
            const user = await mockUserController.getUserByEmail(createUserArgs.email);
            expect(user.password).not.toEqual(createUserArgs.password);
        });
    
        it(`should throw updating password for unknown user`, async () => {
            const createUserArgs1: UserCreateArgs = {
                accountCreated: new Date(2021, 1, 20),
                dob: new Date(1989, 1, 14),
                email: 'goabove1970@gmail.com',
                firstName: 'Ievgen',
                lastName: 'Melnychuk',
                login: 'goabove1',
                ssn: 123456789,
                password: 'password',
                lastLogin: new Date(2021, 1, 20),
            };
    
            mockUserArguments.mockUserCollection = [];
    
            const userId = await mockUserController.create(createUserArgs1);
            console.log(`Created user ${userId}`);
            const updatePassArgs: UserUpdatePasswordArgs = {
                userId: 'non-existing-user-id',
                oldPassword: 'blah',
                newPassword: 'blah-blah',
            };
    
            let thrown = false;
            try{
                await mockUserController.updatePassword(updatePassArgs);
            } catch (err) {
                thrown = true;
                expect(err).toEqual(new DatabaseError('Error updating user password, user not found'));
            }
            expect(thrown).toBeTruthy();
        });
    
        it(`should throw updating password for inactive user`, async () => {
            const createUserArgs1: UserCreateArgs = {
                accountCreated: new Date(2021, 1, 20),
                dob: new Date(1989, 1, 14),
                email: 'goabove1970@gmail.com',
                firstName: 'Ievgen',
                lastName: 'Melnychuk',
                login: 'goabove1',
                ssn: 123456789,
                password: 'password',
                lastLogin: new Date(2021, 1, 20),
            };
    
            mockUserArguments.mockUserCollection = [];
    
            const userId = await mockUserController.create(createUserArgs1);
            console.log(`Created user ${userId}`);
    
            const deleteUserArgs: UserDeleteArgs = {
                userId: userId
            };
            await mockUserController.delete(deleteUserArgs);
            console.log(`Deactivated user ${userId}`);
    
            const updatePassArgs: UserUpdatePasswordArgs = {
                userId,
                oldPassword: 'blah',
                newPassword: 'blah-blah',
            };
    
            let thrown = false;
            try{
                await mockUserController.updatePassword(updatePassArgs);
            } catch (err) {
                thrown = true;
                expect(err).toEqual(new DatabaseError('Error updating user password, user account is inactive'));
            }
            expect(thrown).toBeTruthy();
        });
    
        it(`should throw updating password for invalid old password`, async () => {
            const createUserArgs1: UserCreateArgs = {
                accountCreated: new Date(2021, 1, 20),
                dob: new Date(1989, 1, 14),
                email: 'goabove1970@gmail.com',
                firstName: 'Ievgen',
                lastName: 'Melnychuk',
                login: 'goabove1',
                ssn: 123456789,
                password: 'password',
                lastLogin: new Date(2021, 1, 20),
            };
    
            mockUserArguments.mockUserCollection = [];
    
            const userId = await mockUserController.create(createUserArgs1);
            console.log(`Created user ${userId}`);
    
            const updatePassArgs: UserUpdatePasswordArgs = {
                userId,
                oldPassword: 'blah',
                newPassword: 'blah-blah',
            };
    
            let thrown = false;
            try{
                await mockUserController.updatePassword(updatePassArgs);
            } catch (err) {
                thrown = true;
                expect(err).toEqual(new DatabaseError('Error updating user password, old password could not be verified'));
            }
            expect(thrown).toBeTruthy();
        });
    });

    it(`should link/unlink to user account`, async () => {
        mockUserArguments.mockUserCollection = [];
        mockUserArguments.mockUserAccountLinkCollection = [];

        const createUserArgs: UserCreateArgs = {
            accountCreated: new Date(2021, 1, 20),
            dob: new Date(1989, 1, 14),
            email: 'goabove1970@gmail.com',
            firstName: 'Ievgen',
            lastName: 'Melnychuk',
            login: 'goabove',
            ssn: 123456789,
            password: 'password',
            lastLogin: new Date(2021, 1, 20),
        };

        await mockUserController.create(createUserArgs);
        const user = await mockUserController.getUserByLogin(createUserArgs.login);

        const createAccountArgs: AccountCreateArgs = {
            bankAccountNumber: 'acc_num',
            bankName: 'bank_name',
            userId: 'user_id',
            bankRoutingNumber: 'bank_routing',
        };

        mockableAccountArgs.mockAccountCollection = [];
        const accountId = await mockAccountController.create(createAccountArgs);

        const linkArgs: ManageAccountArgs = {
            userId: user.userId,
            accountId,
        };
        await mockUserController.addAccount(linkArgs);
        const indexOf = mockUserArguments.mockUserAccountLinkCollection.find(
            (link) => link.userId === user.userId && link.accountId === accountId
        );
        expect(indexOf).not.toEqual(-1);
        expect(mockUserArguments.mockUserAccountLinkCollection.length).toBeGreaterThan(0);

        const linksByUserId = await mockUserController.getUserAccountLinks({
            userId: user.userId,
        });
        expect(linksByUserId.length).toEqual(1);
        expect(linksByUserId[0].userId).toEqual(user.userId);
        expect(linksByUserId[0].accountId).toEqual(accountId);

        await mockUserController.removeAccount(linkArgs);
        const indexOfNotFound = mockUserArguments.mockUserAccountLinkCollection.find(
            (link) => link.userId === user.userId && link.accountId === accountId
        );
        expect(indexOfNotFound).toBe(undefined);
        expect(mockUserArguments.mockUserAccountLinkCollection.length).toEqual(0);

        const linksByUserIdAfterRemoval = await mockUserController.getUserAccountLinks({
            userId: user.userId,
        });
        expect(linksByUserIdAfterRemoval.length).toEqual(0);
    });
});
