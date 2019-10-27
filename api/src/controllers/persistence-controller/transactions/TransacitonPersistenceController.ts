import {
  TransactionPersistanceControllerBase,
  TransactionPersistanceControllerReadonlyBase,
} from './TransactionPersistanceControllerBase';
import moment = require('moment');
import { DataController } from '../../data-controller/DataController';
import { chaseTransactionFileDataController } from '../../data-controller/chase/ChaseTransactionFileDataController';
import { ChaseTransaction } from 'src/models/transaction/chase/ChaseTransaction';
import { TransactionReadArg } from 'src/models/transaction/TransactionReadArgs';

export class TransacitonPersistenceController implements TransactionPersistanceControllerBase {
  private dataController: DataController<ChaseTransaction>;

  constructor(controller: DataController<ChaseTransaction>) {
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

  updateTransaction(t: ChaseTransaction, commit: boolean = true): number {
    if (!t.TransactionId) {
      return 0;
    }

    const oldCount = this.dataController.cache.length;
    const deletedCount = this.deleteTransaction(t.TransactionId, false);
    if (deletedCount === 0) {
      return 0;
    }

    this.dataController.cache.push(t);
    const newCount = this.dataController.cache.length;
    if (commit) {
      this.dataController.commitAllRecords();
    }
    return oldCount - newCount;
  }

  addOrUpdateTransaction(t: ChaseTransaction, commit: boolean = true): number {
    if (!t.TransactionId || !this.dataController.cache) {
      return 0;
    }

    const oldCount = this.dataController.cache.length;
    this.deleteTransaction(t.TransactionId, false);
    this.dataController.cache.push(t);
    const newCount = this.dataController.cache.length;
    if (commit) {
      this.dataController.commitAllRecords();
    }
    return oldCount - newCount;
  }

  deleteTransaction(transactionId?: string, commit: boolean = true): number {
    return this.deleteMatchingTransactions(
      {
        transactionId,
      },
      commit
    );
  }

  deleteMatchingTransactions(args: TransactionReadArg, commit: boolean = true): number {
    if (!this.dataController.cache) {
      return 0;
    }

    const oldCount = this.dataController.cache.length;
    this.dataController.cache = this.dataController.cache.filter((t) => !this.matchesArgument(t, args));
    const newCount = this.dataController.cache.length;
    if (commit) {
      this.dataController.commitAllRecords();
    }
    return oldCount - newCount;
  }

  private matchesArgument(t: ChaseTransaction, args: TransactionReadArg): boolean {
    let matches = true;

    if (args.accountId) {
      matches = matches && t.AccountId === args.accountId!;
    }

    if (args.transactionId) {
      matches = matches && t.TransactionId === args.transactionId!;
    }

    if (t.PostingDate && args.startDate) {
      matches = matches && moment(t.PostingDate).isSameOrAfter(moment(args.startDate!));
    }

    if (t.PostingDate && args.endDate) {
      matches = matches && moment(t.PostingDate).isSameOrBefore(moment(args.endDate!));
    }

    if (args.userId) {
      matches = matches && t.AccountId === args.accountId;
    }

    return matches;
  }
}

export class ChaseTransacitonReader implements TransactionPersistanceControllerReadonlyBase {
  private dataController: DataController<ChaseTransaction>;

  constructor(controller: DataController<ChaseTransaction>) {
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

    if (args.accountId) {
      matches = matches && t.AccountId === args.accountId!;
    }

    if (args.transactionId) {
      matches = matches && t.TransactionId === args.transactionId!;
    }

    if (t.PostingDate && args.startDate) {
      matches = matches && moment(t.PostingDate).isSameOrAfter(moment(args.startDate!));
    }

    if (t.PostingDate && args.endDate) {
      matches = matches && moment(t.PostingDate).isSameOrBefore(moment(args.endDate!));
    }

    if (args.userId) {
      matches = matches && t.AccountId === args.accountId;
    }

    return matches;
  }
}

export const chaseTransactionReader = new ChaseTransacitonReader(chaseTransactionFileDataController);
