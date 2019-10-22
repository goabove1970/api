import { ChaseTransaction } from "../../models/transaction/chase/ChaseTransaction";
import { TransactionReadArg } from "../../models/transaction/TransactionReadArgs";

export abstract class TransactionPersistanceControllerReadonlyBase {
    abstract readTransaction(transactionId: string): ChaseTransaction | undefined;
    abstract readAllTransactions(): ChaseTransaction[];
    abstract readTransactionsArg(args: TransactionReadArg): ChaseTransaction[];
    abstract getLastTransaction(args: TransactionReadArg): ChaseTransaction[];
    abstract getTransactionCount(args: TransactionReadArg): number;
}

export abstract class TransactionPersistanceControllerBase extends
    TransactionPersistanceControllerReadonlyBase {

    abstract updateTransaction(transaction: ChaseTransaction): number;
    abstract addOrUpdateTransaction(transaction: ChaseTransaction): number;
    abstract deleteTransaction(transactionId: string): number;
    abstract deleteMatchingTransactions(args: TransactionReadArg): number;
}
