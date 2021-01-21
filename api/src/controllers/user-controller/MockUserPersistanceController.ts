import { DeepPartial } from '@models/DeepPartial';
import { DatabaseError } from '@models/errors/errors';
import { UserCreateArgs } from '@models/user/UserCreateArgs';
import { UserDetails } from '@models/user/UserDetails';
import { UserReadArgs } from '@models/user/UserReadArgs';
import { UserStatus } from '@models/user/UserStatus';
import { UserLoginArgs, UserUpdatePasswordArgs } from '@models/user/UserUpdatePasswordArgs';
import {
    combineNewUser,
    toShortUserDetails,
    validateCreateUserArgs,
    validateUserUpdateArgs,
    validateUserUpdatePasswordArgs,
} from '../data-controller/users/helper';
import { UserPersistanceController } from '@controllers/data-controller/users/UserPersistanceController';
import * as passwordHash from 'password-hash';
import { UserUpdateArgs } from '@models/user/UserUpdateArgs';
import moment = require('moment');
import { UserDeleteArgs } from '@models/user/UserDeleteArgs';
import { ManageAccountArgs } from '@models/user/ManageAccountArgs';
import { UserAccountLink } from '@models/accounts/Account';
import { AccountController } from '@controllers/account-controller/account-controller';

export const mockUserArguments: {
    mockUserCollection: UserDetails[];
    mockAccountController: AccountController;
    mockUserAccountLinkCollection: UserAccountLink[];
} = {
    mockUserCollection: [],
    mockAccountController: undefined,
    mockUserAccountLinkCollection: [],
};

const matchesArgs = (user: UserDetails, args: UserReadArgs) => {
    const mask = args.status;
    if (mask && (user.status & mask) !== mask) {
        return false;
    }

    return true;
};

const updateUser = (user: UserDetails) => {
    const index = mockUserArguments.mockUserCollection.findIndex((e) => e.userId === user.userId);
    if (index !== -1) {
        mockUserArguments.mockUserCollection[index] = user;
    }
};

const deleteUser = (userId: string) => {
    const index = mockUserArguments.mockUserCollection.findIndex((e) => e.userId === userId);
    if (index > -1) {
        mockUserArguments.mockUserCollection.splice(index, 1);
    }
};

const mock_checkLoginAvailable = jest.fn(
    (login: string): Promise<void> => {
        const collection = mockUserArguments.mockUserCollection.filter((u) => u.login === login);
        if (collection && collection.length > 0) {
            throw new DatabaseError('User with this login already exists');
        }
        return Promise.resolve();
    }
);

const mock_checkEmailAvailable = jest.fn(
    (email: string): Promise<void> => {
        const collection = mockUserArguments.mockUserCollection.filter((u) => u.email === email);
        if (collection && collection.length > 0) {
            throw new DatabaseError('User with this email already exists');
        }
        return Promise.resolve();
    }
);

const mock_findUserImpl = jest.fn(
    (userId: string): Promise<UserDetails | undefined> => {
        const collection = mockUserArguments.mockUserCollection.filter((u) => u.userId === userId);
        if (collection && collection.length > 0) {
            return Promise.resolve(collection[0]);
        } else {
            return Promise.resolve(undefined);
        }
    }
);

const mock_getUserById = jest.fn(
    (userId: string): Promise<DeepPartial<UserDetails> | undefined> => {
        return Promise.resolve(
            mock_findUserImpl(userId)
                .then((user) => {
                    if (!user) {
                        return undefined;
                    }
                    return Promise.resolve(toShortUserDetails(user));
                })
                .catch((error) => {
                    throw error;
                })
        );
    }
);

const mock_read = jest.fn(
    (args: UserReadArgs): Promise<DeepPartial<UserDetails>[]> => {
        const filtered = mockUserArguments.mockUserCollection.filter((u) => matchesArgs(u, args));
        return Promise.resolve(filtered.map(toShortUserDetails));
    }
);

const mock_getUserByLogin = jest.fn(
    (login?: string): Promise<UserDetails | undefined> => {
        const user = mockUserArguments.mockUserCollection.filter((u) => u.login === login);
        if (!user) {
            return Promise.resolve(undefined);
        }
        return Promise.resolve(user[0]);
    }
);

const mock_updateLastLogin = jest.fn(
    (userId: string): Promise<void> => {
        return mock_findUserImpl(userId)
            .then((user) => {
                if (!user) {
                    throw new DatabaseError('Error updating user last login, could not find user record');
                }
                user.lastLogin = moment().toDate();
                return user;
            })
            .then((user) => {
                updateUser(user);
            })
            .catch((error) => {
                throw error;
            });
    }
);

const mock_getUserByEmail = jest.fn(
    (email?: string): Promise<UserDetails | undefined> => {
        const user = mockUserArguments.mockUserCollection.filter((u) => u.email === email);
        if (!user) {
            return Promise.resolve(undefined);
        }
        return Promise.resolve(user[0]);
    }
);

const mock_updatePassword = jest.fn(
    (args: UserUpdatePasswordArgs): Promise<void> => {
        validateUserUpdatePasswordArgs(args);

        const { userId, oldPassword, newPassword } = args;
        const returnPromise = mock_findUserImpl(userId).catch(e => {throw e})
        .then((user: UserDetails) => {
            if (!user) {
                throw new DatabaseError('Error updating user password, user not found');
            }
            if (!(user.status & UserStatus.Active)) {
                throw new DatabaseError('Error updating user password, user account is inactive');
            }
            const verified = passwordHash.verify(oldPassword, user.password);
            if (!verified) {
                throw new DatabaseError('Error updating user password, old password could not be verified');
            }
            const newHash = passwordHash.generate(newPassword);
            user.password = newHash;
            return user;
        }).catch((error) => {
            throw error;
        })
        .then((user) => {
            updateUser(user);
        })
        .catch((error) => {
            throw error;
        });
        return returnPromise;
    }
);

const mock_create = jest.fn(
    (args: UserCreateArgs): Promise<string> => {
        validateCreateUserArgs(args);
        const u = combineNewUser(args);
        const validations = Promise.all([mock_checkLoginAvailable(args.login), mock_checkEmailAvailable(args.email)]);
        return Promise.resolve(
            validations
                .then(() => {
                    mockUserArguments.mockUserCollection.push(u);
                    return u.userId;
                })
                .catch((error) => {
                    throw error;
                })
        );
    }
);

const mock_validtePassword = jest.fn(
    (args: UserLoginArgs): Promise<UserDetails | undefined> => {
        const { login, password } = args;
        return mock_getUserByLogin(login)
            .then((user: UserDetails) => {
                if (!user) {
                    throw new DatabaseError('Error validating user password, user not found');
                }
                // we store hash, not the actual password
                if (passwordHash.verify(password, user.password)) {
                    return user;
                }
                return undefined;
            })
            .catch((error) => {
                throw error;
            });
    }
);

const mock_updateUserData = jest.fn(
    (args: UserUpdateArgs): Promise<void> => {
        validateUserUpdateArgs(args);
        return mock_findUserImpl(args.userId)
            .then((user) => {
                if (!user) {
                    throw new DatabaseError('Error updating user data, could not find user record');
                }
                if (!(user.status & UserStatus.Active) && !args.forceUpdate) {
                    throw new DatabaseError('Error updating user data, user account is inactive');
                }

                if (args.lastName) {
                    user.lastName = args.lastName;
                }
                if (args.dob) {
                    user.dob = args.dob;
                }
                if (args.email) {
                    user.email = args.email;
                }
                if (args.firstName) {
                    user.firstName = args.firstName;
                }
                if (args.ssn) {
                    user.ssn = args.ssn;
                }
                if (args.status) {
                    user.status = args.status;
                }
                return user;
            })
            .then((user) => {
                updateUser(user);
            })
            .catch((error) => {
                throw error;
            });
    }
);

const mock_delete = jest.fn(
    (args: UserDeleteArgs): Promise<void> => {
        const { userId, serviceComment, deleteRecord } = args;

        return mock_findUserImpl(userId)
            .then((user) => {
                if (!user) {
                    throw new DatabaseError('Error deleting user, could not find user record');
                }
                if (deleteRecord) {
                    deleteUser(userId);
                } else {
                    user.serviceComment = user.serviceComment + `; ${serviceComment}`;
                    user.status = user.status & UserStatus.Deactivated;
                    return updateUser(user);
                }
            })
            .catch((error) => {
                throw error;
            });
    }
);

const mock_addAccount = jest.fn(
    (args: ManageAccountArgs): Promise<void> => {
        const { userId, accountId } = args;
        return mock_findUserImpl(userId)
            .then((user) => {
                if (!user) {
                    throw new DatabaseError('Could not find user record to link account to user');
                }
            })
            .then(() => {
                return mockUserArguments.mockAccountController.read({
                    accountId,
                });
            })
            .then((account) => {
                if (!account) {
                    throw new DatabaseError('Could not find account record to link account to user');
                }
            })
            .then(() => {
                const filtered = mockUserArguments.mockUserAccountLinkCollection.filter(
                    (ll) => ll.accountId == accountId && ll.userId == userId
                );
                return filtered.length;
            })
            .then((count) => {
                if (count > 0) {
                    throw new DatabaseError('This account has been already linked to this user');
                }
            })
            .then(() => {
                const link: UserAccountLink = {
                    userId,
                    accountId,
                };
                mockUserArguments.mockUserAccountLinkCollection.push(link);
            });
    }
);

const mock_removeAccount = jest.fn(
    (args: ManageAccountArgs): Promise<void> => {
        const { userId, accountId } = args;
        return mock_findUserImpl(userId)
            .then((user) => {
                if (!user) {
                    throw new DatabaseError('Could not find user record to unlink account to user');
                }
            })
            .then(() => {
                return mockUserArguments.mockAccountController.read({
                    accountId,
                });
            })
            .then((account) => {
                if (!account) {
                    throw new DatabaseError('Could not find account record to unlink account to user');
                }
            })
            .then(() => {
                const filtered = mockUserArguments.mockUserAccountLinkCollection.filter(
                    (ll) => ll.accountId == accountId && ll.userId == userId
                );
                return filtered.length;
            })
            .then((count) => {
                if (count === 0) {
                    throw new DatabaseError('This account has been already unlinked from this user');
                }
            })
            .then(() => {
                const indexOf = mockUserArguments.mockUserAccountLinkCollection.findIndex(
                    (ll) => ll.accountId == accountId && ll.userId == userId
                );
                if (indexOf !== -1) {
                    mockUserArguments.mockUserAccountLinkCollection.splice(indexOf, 1);
                }
            });
    }
);

const mock_getUserAccountLinks = jest.fn(
    (args: ManageAccountArgs): Promise<UserAccountLink[]> => {
        const { userId } = args;
        return mock_findUserImpl(userId)
            .then((user) => {
                if (!user) {
                    throw new DatabaseError('Could not find user record to unlink account to user');
                }
            })
            .then(() => {
                return mockUserArguments.mockUserAccountLinkCollection.filter((ll) => ll.userId === userId);
            });
    }
);

export let MockUserPersistanceController = jest.fn<UserPersistanceController, []>(() => ({
    userDataController: undefined,
    accountPersistanceController: undefined,
    userAccountLinkDataController: undefined,
    checkLoginAvailable: mock_checkLoginAvailable,
    findUserImpl: mock_findUserImpl,
    getUserById: mock_getUserById,
    read: mock_read,
    getUserByStringCondition: jest.fn(),
    composeSetStatement: jest.fn(),
    getUserByLogin: mock_getUserByLogin,
    getUserByEmail: mock_getUserByEmail,
    create: mock_create,
    updatePassword: mock_updatePassword,
    validtePassword: mock_validtePassword,
    updateUserData: mock_updateUserData,
    updateLastLogin: mock_updateLastLogin,
    delete: mock_delete,
    addAccount: mock_addAccount,
    removeAccount: mock_removeAccount,
    getUserAccountLinks: mock_getUserAccountLinks,
    readUserAccountResponse: jest.fn(),
    checkEmailAvailable: mock_checkEmailAvailable,
}));
