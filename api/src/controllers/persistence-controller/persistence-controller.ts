import { Transaction } from "../../models/transaction/transaction";
import { TransactionArg } from "./transaction-arg";

export abstract class PersistenceController {
    abstract readTransaction(transactionId: string): Transaction | undefined;
    abstract readAllTransactions(): Transaction[];
    abstract readTransactionsArg(args: TransactionArg): Transaction[];
    abstract getLastTransaction(args: TransactionArg): Transaction[];
    abstract getTransactionCount(args: TransactionArg): number;

    abstract updateTransaction(transaction: Transaction): number;
    abstract addOrUpdateTransaction(transaction: Transaction): number;
    abstract deleteTransaction(transactionId: string): number;
    abstract deleteMatchingTransactions(args: TransactionArg): number;
}
