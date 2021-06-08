import { TransactionReadArg } from '@models/transaction/TransactionReadArgs';
import { Transaction } from '@models/transaction/transaction';
import { TransactionDeleteArgs, TransactionsDeleteArgs } from '@root/src/routes/request-types/TransactionRequests';

export abstract class TransactionPersistenceControllerReadonlyBase {
    abstract read(args: TransactionReadArg): Promise<Transaction[] | number>;
}

export abstract class TransactionPersistenceControllerBase extends TransactionPersistenceControllerReadonlyBase {
    abstract update(transaction: Transaction): Promise<void>;
    abstract add(transaction: Transaction): Promise<void>;
    abstract delete(args: TransactionDeleteArgs): Promise<void>;
    abstract deleteTransactions(args: TransactionsDeleteArgs): Promise<void>;
}
