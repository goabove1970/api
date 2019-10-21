import { PersistenceController } from "./persistence-controller"
import { Transaction } from "../../models/transaction/transaction";
import * as fs from 'fs';
import { chaseParseController } from "../parser-controller";
import { TransactionArg } from './transaction-arg'
import * as moment from  'moment';

export class FilePersistenceController implements PersistenceController {


    private filename: string;
    private cache: Transaction[];
    
    constructor(filename: string) {
        this.filename = filename;
        this.cacheAllTransactions();
    }

    readTransaction(transactionId: string): Transaction | undefined {
        if (!this.cache) {
            return undefined;
        }

        const filtered = this.cache.filter(t => this.matchesArgument(t, {
            transactionId
        }));

        if (filtered.length > 0) {
            return filtered[0];
        }

        return undefined;
    }
    
    readAllTransactions(): Transaction[] {
        return this.cache || [];
    }

    readTransactionsArg(args: TransactionArg): Transaction[] {
        if (!this.cache) {
            return [];
        }

        return this.cache.filter(t => this.matchesArgument(t, args));
    }

    getLastTransaction(args: TransactionArg): Transaction[] {
        if (!this.cache) {
            return [];
        }
        
        const filtered =  this.cache.filter(t => this.matchesArgument(t, args) && t.PostingDate!!).
            sort((t1: Transaction, t2: Transaction) => this.compareDates(t2, t1)); // descending

        const readCount = args.readCount ? args.readCount : 1;

        if (filtered.length >= readCount) {
            return filtered.slice(readCount);
        } else {
            return filtered.slice(filtered.length);
        }

        return [];
    }

    private compareDates(date1: Transaction, date2: Transaction): number {
        if (date1 === date2) {
            return 0;
        }

        if (date1 > date2) {
            return 1;
        }

        return  -1;
    }

    getTransactionCount(args: TransactionArg): number {
        if (!this.cache) {
            return 0;
        }
        
        return this.cache.filter(t => this.matchesArgument(t, args)).length;
    }

    updateTransaction(t: Transaction, commit: boolean = true): number {
        if (!t.TransactionId) {
            return 0;
        }

        const oldCount = this.cache.length;
        const deletedCount = this.deleteTransaction(t.TransactionId, false);
        if (deletedCount === 0) {
            return 0;
        }

        this.cache.push(t);
        const newCount = this.cache.length;
        if (commit) {
            this.commitAllTransactions();
        }
        return oldCount - newCount;
    }

    addOrUpdateTransaction(t: Transaction, commit: boolean = true): number {
        if (!t.TransactionId || !this.cache) {
            return 0;
        }

        const oldCount = this.cache.length;
        this.deleteTransaction(t.TransactionId, false);
        this.cache.push(t);
        const newCount = this.cache.length;
        if (commit) {
            this.commitAllTransactions();
        }
        return oldCount - newCount;
    }

    deleteTransaction(transactionId?: string, commit: boolean = true): number {
        return this.deleteMatchingTransactions({
            transactionId
        }, commit);
    }

    deleteMatchingTransactions(args: TransactionArg, commit: boolean = true): number {
        if (!this.cache) {
            return 0;
        }

        const oldCount = this.cache.length;
        this.cache = this.cache.filter(t => !this.matchesArgument(t, args));
        const newCount = this.cache.length;
        if (commit) {
            this.commitAllTransactions();
        }
        return oldCount - newCount;
    }

    private matchesArgument(t: Transaction, args: TransactionArg): boolean {
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

    cacheAllTransactions(): number {
        const data = fs.readFileSync(this.filename, 'utf8');
        this.cache = chaseParseController.parseFile(data);
        return this.cache.length;
    }

    commitAllTransactions(): number {
        const csvTransactions = chaseParseController.transacitonsToFileString(this.cache || []);
        fs.writeFileSync(this.filename, csvTransactions, 'utf8');
        return this.cache.length;
    }
}


export const filePersistanceController: PersistenceController = 
new FilePersistenceController('/Users/ievgenmelnychuk/Desktop/First/src/controllers/helper/debit.csv');
