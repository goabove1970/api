import { TransactionPersistanceControllerReadonlyBase } from './TransactionPersistanceControllerBase';
import { CachedDataController } from '../CachedDataController';
import { ChaseTransaction } from '@models/transaction/chase/ChaseTransaction';
import { TransactionReadArg } from '@models/transaction/TransactionReadArgs';
import { Transaction } from '@root/src/models/transaction/Transaction';
import moment = require('moment');
import { chaseTransactionFileDataController } from '../chase/ChaseTransactionFileDataController';
export class ChaseTransacitonReader implements TransactionPersistanceControllerReadonlyBase {
    read(args: TransactionReadArg): Promise<Transaction[]> {
        throw new Error('Method not implemented.');
    }
    private dataController: CachedDataController<ChaseTransaction>;
    constructor(controller: CachedDataController<ChaseTransaction>) {
        this.dataController = controller;
    }
    readTransaction(transactionId: string): ChaseTransaction | undefined {
        if (!this.dataController.cache) {
            return undefined;
        }
        const filtered = this.dataController.cache.filter((t) =>
            this.matchesArgument(t, {
                transactionId,
            })
        );
        if (filtered.length > 0) {
            return filtered[0];
        }
        return undefined;
    }
    readAllTransactions(): ChaseTransaction[] {
        return this.dataController.cache || [];
    }
    readTransactionsArg(args: TransactionReadArg): ChaseTransaction[] {
        if (!this.dataController.cache) {
            return [];
        }
        return this.dataController.cache.filter((t) => this.matchesArgument(t, args));
    }
    getLastTransaction(args: TransactionReadArg): ChaseTransaction[] {
        if (!this.dataController.cache) {
            return [];
        }
        const filtered = this.dataController.cache
            .filter((t) => this.matchesArgument(t, args) && t.PostingDate!!)
            .sort((t1: ChaseTransaction, t2: ChaseTransaction) => this.compareDates(t2, t1)); // descending
        const readCount = args.readCount ? args.readCount : 1;
        if (filtered.length >= readCount) {
            return filtered.slice(readCount);
        } else {
            return filtered.slice(filtered.length);
        }
        return [];
    }
    private compareDates(date1: ChaseTransaction, date2: ChaseTransaction): number {
        if (date1 === date2) {
            return 0;
        }
        if (date1 > date2) {
            return 1;
        }
        return -1;
    }
    getTransactionCount(args: TransactionReadArg): number {
        if (!this.dataController.cache) {
            return 0;
        }
        return this.dataController.cache.filter((t) => this.matchesArgument(t, args)).length;
    }
    private matchesArgument(t: ChaseTransaction, args: TransactionReadArg): boolean {
        let matches = true;
        if (t.PostingDate && args.startDate) {
            matches = matches && moment(t.PostingDate).isSameOrAfter(moment(args.startDate!));
        }
        if (t.PostingDate && args.endDate) {
            matches = matches && moment(t.PostingDate).isSameOrBefore(moment(args.endDate!));
        }
        return matches;
    }
}

export const chaseTransactionReader = new ChaseTransacitonReader(chaseTransactionFileDataController);
