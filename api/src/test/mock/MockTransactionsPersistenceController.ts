import { Transaction, TransactionUpdateArgs } from '@models/transaction/transaction';
import { SortOrder, TransactionReadArg } from '@models/transaction/TransactionReadArgs';
import { TransactionDeleteArgs } from '@routes/request-types/TransactionRequests';
import moment = require('moment');
import { TransactionStatus } from '@models/transaction/transaction';
import { UserPersistenceController } from '@controllers/data-controller/users/UserPersistenceController';
import { TransacitonPersistenceController } from '@controllers/data-controller/transaction/TransacitonPersistenceController';

export const mockableTransactionArgs: {
    mockTransactionCollection: Transaction[];
    userPersistenceController: UserPersistenceController;
} = {
    mockTransactionCollection: [],
    userPersistenceController: undefined,
};

const getCollection: () => Transaction[] = () => {
    return mockableTransactionArgs.mockTransactionCollection;
};

const mock_add = jest.fn(
    (args: Transaction): Promise<void> => {
        getCollection().push(args);
        return Promise.resolve();
    }
);

const updateTransaction = (tr: Transaction) => {
    const index = getCollection().findIndex((e) => e.transactionId === tr.transactionId);
    if (index !== -1) {
        getCollection()[index] = tr;
    }
};

const deleteTransaction = (transactionId: string) => {
    const index = getCollection().findIndex((e) => e.transactionId === transactionId);
    if (index > -1) {
        getCollection().splice(index, 1);
    }
};

const getMatchingTransactions = (args: TransactionReadArg): Promise<Transaction[]> => {
    if (!args) {
        return Promise.resolve([]);
    }

    let initFilteredCollection: Promise<Transaction[]>;
    if (args.accountId) {
        initFilteredCollection = Promise.resolve(
            getCollection().filter((tr) => tr.accountId && tr.accountId === args.accountId)
        );
    } else if (args.accountIds) {
        initFilteredCollection = Promise.resolve(
            getCollection().filter((tr) => tr.accountId && args.accountIds.includes(tr.accountId))
        );
    } else {
        return Promise.resolve([]);
    }

    return initFilteredCollection.then((filtered: Transaction[]) => {
        switch (args.categorization) {
            case 'categorized':
                filtered = filtered.filter((tr) => tr.categoryId !== undefined);
                break;
            case 'uncategorized':
                filtered = filtered.filter((tr) => tr.categoryId === undefined);
                break;
        }

        if (args.transactionId) {
            filtered = filtered.filter((tr) => tr.transactionId === args.transactionId);
        }

        if (args.startDate) {
            filtered = filtered.filter((tr) =>
                moment(tr.chaseTransaction.PostingDate).isSameOrAfter(args.transactionId)
            );
        }

        if (args.endDate) {
            filtered = filtered.filter((tr) =>
                moment(tr.chaseTransaction.PostingDate).isSameOrBefore(args.transactionId)
            );
        }

        if (args.order) {
            if ((args.order! as SortOrder) === SortOrder.accending) {
                filtered = filtered.sort((tr1: Transaction, tr2: Transaction) => {
                    return moment(tr1.chaseTransaction.PostingDate).diff(moment(tr2.chaseTransaction.PostingDate));
                });
            } else {
                filtered = filtered.sort((tr1: Transaction, tr2: Transaction) => {
                    return -moment(tr1.chaseTransaction.PostingDate).diff(moment(tr2.chaseTransaction.PostingDate));
                });
            }
        }

        if (args.offset) {
            filtered = filtered.slice(args.offset);
        }

        if (args.readCount) {
            filtered = filtered.slice(0, args.readCount);
        }

        return Promise.resolve(filtered);
    });
};

const mock_read = jest.fn(
    (args: TransactionReadArg): Promise<Transaction[] | number> => {
        const res = getMatchingTransactions(args).then((transactions: Transaction[] | number) => {
            if (args.countOnly) {
                return Promise.resolve(transactions as number);
            }
            return Promise.resolve(transactions);
        });
        return res;
    }
);

const mock_update = jest.fn(
    (args: TransactionUpdateArgs): Promise<void> => {
        return mock_read({
            transactionId: args.transactionId,
        }).then((transactions: number | Transaction[]) => {
            const transcollection = transactions as Transaction[];
            if (transcollection.length !== 1) {
                return Promise.resolve();
            }
            const tr = transcollection[0];
            if (args.accountId) {
                tr.accountId = args.accountId;
            }
            if (args.categoryId) {
                tr.categoryId = args.categoryId;
            }
            if (args.importedDate) {
                tr.importedDate = args.importedDate;
            }
            if (args.overrideCategory) {
                tr.overrideCategory = args.overrideCategory;
            }
            if (args.overrideDescription) {
                tr.overrideDescription = args.overrideDescription;
            }
            if (args.overridePostingDate) {
                tr.overridePostingDate = args.overridePostingDate;
            }
            if (args.businessId) {
                tr.businessId = args.businessId;
            }
            if (args.processingStatus) {
                tr.processingStatus = args.processingStatus;
            }
            if (args.serviceType) {
                tr.serviceType = args.serviceType;
            }
            if (args.transactionStatus) {
                tr.transactionStatus = args.transactionStatus;
            } else {
                if (args.statusModification === 'hide') {
                    args.transactionStatus |= TransactionStatus.hidden;
                    tr.transactionStatus = args.transactionStatus;
                } else if (args.statusModification === 'unhide') {
                    args.transactionStatus &= ~TransactionStatus.hidden;
                    tr.transactionStatus = args.transactionStatus;
                }
                if (args.statusModification === 'include') {
                    args.transactionStatus &= ~TransactionStatus.excludeFromBalance;
                    tr.transactionStatus = args.transactionStatus;
                } else if (args.statusModification === 'exclude') {
                    args.transactionStatus |= TransactionStatus.excludeFromBalance;
                    tr.transactionStatus = args.transactionStatus;
                }
            }
            if (args.userComment) {
                tr.userComment = args.userComment;
            }

            updateTransaction(tr);
            return Promise.resolve();
        });
    }
);

const mock_delete = jest.fn(
    (args: TransactionDeleteArgs): Promise<void> => {
        if (args.transaction && args.transaction.transactionId) {
            deleteTransaction(args.transaction.transactionId);
            return Promise.resolve();
        } else if (args.accountId) {
            const userTransactions = mock_read({
                accountId: args.accountId,
            });
            return userTransactions.then((tr: number | Transaction[]) => {
                const matchingTransactions = tr as Transaction[];
                for (let transaction in matchingTransactions) {
                    deleteTransaction(transaction);
                }
            });
        }
        return Promise.resolve();
    }
);

export let MockTransactionPersistenceController = jest.fn<TransacitonPersistenceController, []>(() => ({
    add: mock_add,
    read: mock_read,
    update: mock_update,
    delete: mock_delete,
    dataController: undefined,
    matchesReadArgs: undefined,
}));
