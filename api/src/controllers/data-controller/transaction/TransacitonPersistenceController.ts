import { TransactionPersistenceControllerBase } from './TransactionPersistenceControllerBase';
import { SortOrder, TransactionReadArg } from '@models/transaction/TransactionReadArgs';
import { DatabaseController } from '../DataController';
import { Transaction, TransactionUpdateArgs, TransactionStatus } from '@models/transaction/transaction';
import { transactionPostgresDataController } from './TransactionPostgresController';
import moment = require('moment');
import { TransactionDeleteArgs, TransactionsDeleteArgs } from '@routes/request-types/TransactionRequests';
import { logHelper } from '@root/src/logger';
import { inspect } from 'util';

export class TransacitonPersistenceController implements TransactionPersistenceControllerBase {
    dataController: DatabaseController<Transaction>;

    constructor(controller: DatabaseController<Transaction>) {
        this.dataController = controller;
    }

    async matchesReadArgs(args: TransactionReadArg | TransactionDeleteArgs | any): Promise<string> {
        if (!args) {
            return '';
        }

        const conditions = [];
        if (args.userId) {
            const accounts = await transactionDatabaseController
                .read({
                    userId: args.userId,
                    filter: args.filter,
                })
                .then((accs) =>
                    (accs as Transaction[])
                        .map((acc) => acc.accountId)
                        .filter((accid) => accid !== undefined)
                        .map((acc) => `'${acc}'`)
                );

            conditions.push(`account_id in (${accounts.join(', ')})`);
        }

        if (args.accountId) {
            conditions.push(`account_id in ('${args.accountId}')`);
        }

        if (args.filter) {
            const lower = (args.filter || '').toLowerCase();
            const lowerEscape = escape(lower);
            conditions.push(
                `(LOWER(description) ILIKE '%${lower}%' 
              or LOWER(override_description) ILIKE '%${lower}%'
              or LOWER(user_comment) ILIKE '%${lower}%'
              or LOWER(description) ILIKE '%${lowerEscape}%' 
              or LOWER(override_description) ILIKE '%${lowerEscape}%'
              or LOWER(user_comment) ILIKE '%${lowerEscape}%')`
            );
        }

        if (args.accountIds && args.accountIds.length > 0) {
            const expr = args.accountIds.map((e) => `'${e}'`).join(', ');
            conditions.push(`account_id in (${expr})`);
        }

        if (args.reloadTransactions && args.reloadTransactions.length > 0) {
            const expr = args.reloadTransactions.map((e) => `'${e}'`).join(', ');
            conditions.push(`transaction_id in (${expr})`);
        }

        if (args.categorization) {
            switch (args.categorization) {
                case 'categorized':
                    conditions.push('category_id is not NULL');
                    break;
                case 'uncategorized':
                    conditions.push('category_id is NULL');
                    break;
            }
        }

        if (args.userId) {
            conditions.push(`user_id=${!args.userId ? 'NULL' : args.userId}`);
        }

        if (args.transactionId) {
            conditions.push(`transaction_id='${args.transactionId}'`);
        }

        if (args.transaction && args.transaction.transactionId) {
            conditions.push(`transaction_id='${args.transaction.transactionId}'`);
        }

        if (args.startDate) {
            conditions.push(`posting_date>=${"'" + moment(args.startDate).toISOString() + "'"}`);
        }

        if (args.endDate) {
            conditions.push(`posting_date<='${moment(args.endDate).toISOString()}'`);
        }

        let finalSattement = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        if (args.order) {
            if ((args.order! as SortOrder) === SortOrder.accending) {
                finalSattement = `${finalSattement} order by posting_date asc`;
            } else {
                finalSattement = `${finalSattement} order by posting_date desc`;
            }
        }

        if (args.readCount) {
            finalSattement = `${finalSattement} limit ${args.readCount}`;
        }

        if (args.offset) {
            finalSattement = `${finalSattement} offset ${args.offset}`;
        }

        return finalSattement;
    }

    update(args: TransactionUpdateArgs): Promise<void> {
        const updateFields: string[] = [];

        if (args.accountId) {
            updateFields.push(`account_id='${args.accountId}'`);
        }

        if (args.categoryId) {
            updateFields.push(`category_id='${args.categoryId}'`);
        }

        if (args.importedDate) {
            updateFields.push(`imported_date='${moment(args.importedDate).toISOString()}'`);
        }

        if (args.overrideCategory) {
            updateFields.push(`override_category_id='${args.overrideCategory}'`);
        }

        if (args.overrideDescription) {
            updateFields.push(`override_description='${escape(args.overrideDescription)}'`);
        }

        if (args.overridePostingDate) {
            updateFields.push(`override_posting_date='${moment(args.overridePostingDate).toISOString()}'`);
        }

        if (args.businessId === null) {
            updateFields.push(`business_id=NULL`);
        } else if (args.businessId) {
            updateFields.push(`business_id='${args.businessId}'`);
        }

        if (args.processingStatus) {
            updateFields.push(`processing_status=${args.processingStatus}`);
        }

        if (args.serviceType) {
            updateFields.push(`service_type=${args.serviceType}`);
        }

        if (!args.statusModification && args.transactionStatus !== undefined) {
            updateFields.push(`transaction_status=${args.transactionStatus}`);
        } else {
            if (args.statusModification === 'hide') {
                args.transactionStatus |= TransactionStatus.hidden;
                updateFields.push(`transaction_status=${args.transactionStatus}`);
            } else if (args.statusModification === 'unhide') {
                args.transactionStatus &= ~TransactionStatus.hidden;
                updateFields.push(`transaction_status=${args.transactionStatus}`);
            }

            if (args.statusModification === 'include') {
                args.transactionStatus &= ~TransactionStatus.excludeFromBalance;
                updateFields.push(`transaction_status=${args.transactionStatus}`);
            } else if (args.statusModification === 'exclude') {
                args.transactionStatus |= TransactionStatus.excludeFromBalance;
                updateFields.push(`transaction_status=${args.transactionStatus}`);
            }
        }

        if (args.userComment) {
            updateFields.push(`user_comment='${args.userComment}'`);
        }

        const updateStatement = updateFields.join(',\n');

        this.dataController.update(`
                    SET
                        ${updateStatement}
                    WHERE 
                        transaction_id='${args.transactionId}';`);
        return Promise.resolve();
    }

    add(args: Transaction): Promise<void> {
        this.dataController.insert(`
        (
            transaction_id, account_id,
            imported_date, category_id, user_comment,
            override_posting_date, override_description,
            service_type, override_category_id, transaction_status,
            processing_status, details, posting_date, description,
            amount, transaction_type, balance, check_no, business_id,
            credit_card_transaction_type, bank_defined_transaction)
            VALUES (
                '${args.transactionId}',
                '${args.accountId}',
                '${moment().toISOString()}',
                ${args.categoryId ? "'" + args.categoryId + "'" : 'NULL'},
                ${args.userComment ? "'" + escape(args.userComment) + "'" : 'NULL'},
                ${args.overridePostingDate ? "'" + moment(args.overridePostingDate).toISOString() + "'" : 'NULL'},
                ${args.overrideDescription ? "'" + escape(args.overrideDescription) + "'" : 'NULL'},
                ${args.serviceType ? args.serviceType : 'NULL'},
                ${args.overrideCategory ? "'" + args.overrideCategory + "'" : 'NULL'},
                ${args.transactionStatus ? args.transactionStatus : 'NULL'},
                ${args.processingStatus ? args.processingStatus : 'NULL'},
                ${args.chaseTransaction.Details ? "'" + args.chaseTransaction.Details + "'" : 'NULL'},
                ${
                    args.chaseTransaction.PostingDate
                        ? "'" + moment(args.chaseTransaction.PostingDate).toISOString() + "'"
                        : 'NULL'
                },
                ${args.chaseTransaction.Description ? "'" + escape(args.chaseTransaction.Description) + "'" : 'NULL'},
                ${args.chaseTransaction.Amount ? args.chaseTransaction.Amount : 'NULL'},
                ${args.chaseTransaction.Type ? "'" + args.chaseTransaction.Type + "'" : 'NULL'},
                ${args.chaseTransaction.Balance ? args.chaseTransaction.Balance : 'NULL'},
                ${args.chaseTransaction.CheckOrSlip ? "'" + escape(args.chaseTransaction.CheckOrSlip) + "'" : 'NULL'},
                ${args.businessId ? "'" + args.businessId + "'" : 'NULL'},
                ${
                    args.chaseTransaction.CreditCardTransactionType
                        ? "'" + args.chaseTransaction.CreditCardTransactionType + "'"
                        : 'NULL'
                },
                ${
                    args.chaseTransaction.BankDefinedCategory
                        ? "'" + args.chaseTransaction.BankDefinedCategory + "'"
                        : 'NULL'
                });`);
        return Promise.resolve();
    }

    delete(args: TransactionDeleteArgs): Promise<void> {
        return this.matchesReadArgs(args).then((expression) => {
            this.dataController.delete(expression).catch((error) => {
                throw error;
            });
        });
    }

    deleteTransactions(args: TransactionsDeleteArgs): Promise<void> {
        if (args && args.transactionIds && args.transactionIds.length > 0) {
            const promises = args.transactionIds.map((t) => this.delete({ transaction: { transactionId: t } }));
            return Promise.allSettled(promises)
                .catch((err) => {
                    throw err;
                })
                .then();
        }
        return Promise.resolve();
    }

    read(args: TransactionReadArg): Promise<Transaction[] | number> {
        console.log(`TransacitonPersistenceController.read: ${inspect(args)}`);
        return this.matchesReadArgs(args)
            .then((expression) => {
                let result: Promise<Transaction[] | number>;
                if (args.countOnly) {
                    result = this.dataController.count(expression);
                }
                result = this.dataController.select(expression);
                return result;
            })
            .catch((e) => {
                logHelper.error(e);
                throw e;
            });
    }
}

export const transactionDatabaseController = new TransacitonPersistenceController(transactionPostgresDataController);
