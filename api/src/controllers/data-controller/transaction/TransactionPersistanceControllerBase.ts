import { TransactionReadArg } from '@models/transaction/TransactionReadArgs';
import { Transaction } from '@models/transaction/transaction';

export abstract class TransactionPersistanceControllerReadonlyBase {
    abstract read(args: TransactionReadArg): Promise<Transaction[] | number>;
}

export abstract class TransactionPersistanceControllerBase extends TransactionPersistanceControllerReadonlyBase {
    abstract update(transaction: Transaction): Promise<void>;
    abstract add(transaction: Transaction): Promise<void>;
    abstract delete(args: TransactionReadArg): Promise<void>;
}
