import { AccountPersistenceControllerBase } from '../AccountPersistenceControllerBase';
import {
    matchesReadArgs,
    validateCreateAccountArgs,
    combineNewAccount,
    validateAccountUpdateArgs,
    toShortAccountDetails,
    AccountResponseModel,
} from '../helper';
import { UserAccount } from '@models/accounts/Account';
import { ReadAccountArgs } from '@models/accounts/ReadAccountArgs';
import { AccountCreateArgs } from '@models/accounts/AccountCreateArgs';
import { AccountUpdateArgs } from '@models/accounts/AccountUpdateArgs';
import { AccountDeleteArgs } from '@models/accounts/AccountDeleteArgs';
import { AccountStatus } from '@models/accounts/AccountStatus';
import { DatabaseController } from '../../DataController';
import { DatabaseError } from '@models/errors/errors';
import moment = require('moment');

export class AccountPersistenceController extends AccountPersistenceControllerBase {
    accountDataController: DatabaseController<UserAccount>;

    constructor(controller: DatabaseController<UserAccount>) {
        super();
        this.accountDataController = controller;
    }

    findAccountImpl(accountId: string): Promise<UserAccount | undefined> {
        return this.accountDataController
            .select(`WHERE account_id='${accountId}'`)
            .then((c) => {
                {
                    return c && c.length > 0 ? c[0] : undefined;
                }
            })
            .catch((error) => {
                throw error;
            });
    }

    read(args: ReadAccountArgs): Promise<AccountResponseModel[]> {
        return this.accountDataController
            .select(matchesReadArgs(args), args.userId ? 'ac.*' : undefined)
            .then((c) => c.map(toShortAccountDetails))
            .catch((error) => {
                throw error;
            });
    }

    create(args: AccountCreateArgs): Promise<string> {
        const a: UserAccount = combineNewAccount(args);
        validateCreateAccountArgs(args);
        return this.accountDataController
            .insert(
                `
                (
                    account_id,
                    bank_routing_number,
                    bank_account_number,
                    bank_name,
                    card_number,
                    account_alias,
                    create_date,
                    card_expiration,
                    status,
                    service_comment,
                    account_type)
                    VALUES (
                        '${a.accountId}', 
                        '${a.bankRoutingNumber}',
                        '${a.bankAccountNumber}',
                        ${a.bankName ? "'" + a.bankName + "'" : 'NULL'},
                        ${a.cardNumber ? "'" + a.cardNumber + "'" : 'NULL'},
                        ${a.alias ? "'" + a.alias + "'" : 'NULL'},
                        ${a.createDate ? "'" + moment(a.createDate).toISOString() + "'" : 'NULL'},
                        ${a.cardExpiration ? "'" + moment(a.cardExpiration).toISOString() + "'" : 'NULL'},
                        ${a.status ? a.status : 'NULL'},
                        ${a.serviceComment ? "'" + a.serviceComment + "'" : 'NULL'},
                        ${a.accountType ? a.accountType : 'NULL'});`
            )
            .then(() => {
                return a.accountId;
            })
            .catch((error) => {
                throw error;
            });
    }

    update(args: AccountUpdateArgs): Promise<void> {
        return validateAccountUpdateArgs(args)
            .then(() => {
                return this.findAccountImpl(args.accountId);
            })
            .then((account) => {
                if (!account) {
                    throw new DatabaseError('Error updating account data, could not find account record');
                }
                // if (!(account.status & AccountStatus.Active) && !args.forceUpdate) {
                //     throw new DatabaseError('Error updating account data, user bank account is inactive');
                // }
                return account;
            })
            .then((account) => {
                if (args.userId) {
                    account.userId = args.userId;
                }
                if (args.bankRoutingNumber) {
                    account.bankRoutingNumber = args.bankRoutingNumber;
                }
                if (args.bankAccountNumber) {
                    account.bankAccountNumber = args.bankAccountNumber;
                }
                if (args.bankName) {
                    account.bankName = args.bankName;
                }
                if (args.cardExpiration) {
                    account.cardExpiration = args.cardExpiration;
                }
                if (args.alias) {
                    account.alias = args.alias;
                }
                if (args.cardNumber) {
                    account.cardNumber = args.cardNumber;
                }
                if (args.status || args.status === 0) {
                    account.status = args.status;
                }
                if (args.accountType || args.accountType === 0) {
                    account.accountType = args.accountType;
                }
                if (args.serviceComment) {
                    account.serviceComment = args.serviceComment;
                }
                return account;
            })
            .then((account) => {
                this.accountDataController.update(this.composeSetStatement(account));
            })
            .catch((error) => {
                throw error;
            });
    }

    composeSetStatement(a: UserAccount): string {
        return `
        SET
            bank_routing_number=${a.bankRoutingNumber},
            bank_account_number=${a.bankAccountNumber},
            bank_name='${a.bankName}',
            card_number='${a.cardNumber}',
            account_alias='${a.alias}',
            create_date=${a.createDate ? "'" + moment(a.createDate).toISOString() + "'" : 'NULL'},
            card_expiration=${a.cardExpiration ? "'" + moment(a.cardExpiration).toISOString() + "'" : 'NULL'},
            status=${a.status ? a.status : 'NULL'},
            service_comment=${a.serviceComment ? "'" + a.serviceComment + "'" : 'NULL'},
            account_type=${a.accountType ? a.accountType : 'NULL'}
        WHERE
            account_id='${a.accountId}';`;
    }

    delete(args: AccountDeleteArgs): Promise<void> {
        const { accountId, serviceComment, deleteRecord } = args;
        return this.findAccountImpl(accountId)
            .then((a) => {
                if (!a) {
                    throw new DatabaseError('Error deleting account, could not find bank account record');
                }
                if (deleteRecord) {
                    return this.accountDataController.delete(`where "account_id"='${accountId}'`).then(() => {});
                } else {
                    a.serviceComment = a.serviceComment + `; ${serviceComment}`;
                    a.status = a.status & AccountStatus.Deactivated;
                    return this.accountDataController.update(this.composeSetStatement(a)).then(() => {});
                }
            })
            .catch((error) => {
                throw error;
            });
    }
}
