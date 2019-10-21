"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const parser_controller_1 = require("../parser-controller");
const moment = require("moment");
class FilePersistenceController {
    constructor(filename) {
        this.filename = filename;
        this.cacheAllTransactions();
    }
    readTransaction(transactionId) {
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
    readAllTransactions() {
        return this.cache || [];
    }
    readTransactionsArg(args) {
        if (!this.cache) {
            return [];
        }
        return this.cache.filter(t => this.matchesArgument(t, args));
    }
    getLastTransaction(args) {
        if (!this.cache) {
            return [];
        }
        const filtered = this.cache.filter(t => this.matchesArgument(t, args) && t.PostingDate).
            sort((t1, t2) => this.compareDates(t2, t1));
        const readCount = args.readCount ? args.readCount : 1;
        if (filtered.length >= readCount) {
            return filtered.slice(readCount);
        }
        else {
            return filtered.slice(filtered.length);
        }
        return [];
    }
    compareDates(date1, date2) {
        if (date1 === date2) {
            return 0;
        }
        if (date1 > date2) {
            return 1;
        }
        return -1;
    }
    getTransactionCount(args) {
        if (!this.cache) {
            return 0;
        }
        return this.cache.filter(t => this.matchesArgument(t, args)).length;
    }
    updateTransaction(t, commit = true) {
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
    addOrUpdateTransaction(t, commit = true) {
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
    deleteTransaction(transactionId, commit = true) {
        return this.deleteMatchingTransactions({
            transactionId
        }, commit);
    }
    deleteMatchingTransactions(args, commit = true) {
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
    matchesArgument(t, args) {
        let matches = true;
        if (args.accountId) {
            matches = matches && t.AccountId === args.accountId;
        }
        if (args.transactionId) {
            matches = matches && t.TransactionId === args.transactionId;
        }
        if (t.PostingDate && args.startDate) {
            matches = matches && moment(t.PostingDate).isSameOrAfter(moment(args.startDate));
        }
        if (t.PostingDate && args.endDate) {
            matches = matches && moment(t.PostingDate).isSameOrBefore(moment(args.endDate));
        }
        if (args.userId) {
            matches = matches && t.AccountId === args.accountId;
        }
        return matches;
    }
    cacheAllTransactions() {
        const data = fs.readFileSync(this.filename, 'utf8');
        this.cache = parser_controller_1.chaseParseController.parseFile(data);
        return this.cache.length;
    }
    commitAllTransactions() {
        const csvTransactions = parser_controller_1.chaseParseController.transacitonsToFileString(this.cache || []);
        fs.writeFileSync(this.filename, csvTransactions, 'utf8');
        return this.cache.length;
    }
}
exports.FilePersistenceController = FilePersistenceController;
exports.filePersistanceController = new FilePersistenceController('/Users/ievgenmelnychuk/Desktop/First/src/controllers/helper/debit.csv');
//# sourceMappingURL=file-persistence-controller.js.map