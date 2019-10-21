"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transaction_origin_type_1 = require("../../models/transaction/transaction-origin-type");
const transaction_type_1 = require("../../models/transaction/transaction-type");
function parseNumer(line) {
    try {
        const number = Number.parseFloat(line);
        return number;
    }
    catch (error) {
        console.log(JSON.stringify(error, null, 4));
    }
    return undefined;
}
exports.parseNumer = parseNumer;
function parseAmount(line) {
    return parseNumer(line);
}
exports.parseAmount = parseAmount;
function parseBalance(line) {
    return parseNumer(line);
}
exports.parseBalance = parseBalance;
function parseChaseTransDetails(details) {
    switch (details) {
        case 'DEBIT':
            return transaction_origin_type_1.TransactionOriginType.Debit;
        case 'CREDIT':
            return transaction_origin_type_1.TransactionOriginType.Credit;
        case 'CHECK':
            return transaction_origin_type_1.TransactionOriginType.Check;
        case 'DSLIP':
            return transaction_origin_type_1.TransactionOriginType.Dslip;
    }
    throw {
        part: 'TransactionOriginType',
        message: `Could not parse ${details} TransactionOriginType`
    };
}
exports.parseChaseTransDetails = parseChaseTransDetails;
function parseTransactionType(line) {
    try {
        switch (line) {
            case 'ACCT_XFER':
                return transaction_type_1.TransactionType.AccountTransfer;
            case 'ACH_CREDIT':
                return transaction_type_1.TransactionType.AchCredit;
            case 'ACH_DEBIT':
                return transaction_type_1.TransactionType.AchDebit;
            case 'ATM':
                return transaction_type_1.TransactionType.Atm;
            case 'ATM_DEPOSIT':
                return transaction_type_1.TransactionType.AtmDeposit;
            case 'CHASE_TO_PARTNERFI':
                return transaction_type_1.TransactionType.ChaseToPartner;
            case 'CHECK_DEPOSIT':
                return transaction_type_1.TransactionType.CheckDeposit;
            case 'CHECK_PAID':
                return transaction_type_1.TransactionType.CheckPaid;
            case 'DEBIT_CARD':
                return transaction_type_1.TransactionType.DebitCard;
            case 'DEPOSIT':
                return transaction_type_1.TransactionType.Deposit;
            case 'FEE_TRANSACTION':
                return transaction_type_1.TransactionType.FeeTransaction;
            case 'MISC_CREDIT':
                return transaction_type_1.TransactionType.MiscCredit;
            case 'MISC_DEBIT':
                return transaction_type_1.TransactionType.MiscDebit;
            case 'PARTNERFI_TO_CHASE':
                return transaction_type_1.TransactionType.PartnerToChase;
            case 'QUICKPAY_CREDIT':
                return transaction_type_1.TransactionType.QuickPayCredit;
            case 'QUICKPAY_DEBIT':
                return transaction_type_1.TransactionType.QuickPayDebit;
            case 'WIRE_OUTGOING':
                return transaction_type_1.TransactionType.WireOutgoing;
            case 'WIRE_INGOING':
                return transaction_type_1.TransactionType.WireIngoing;
        }
    }
    catch (error) {
        throw {
            part: 'TransactionType',
            message: `Could not parse ${line} TransactionType, ${error.message}`
        };
    }
    return transaction_type_1.TransactionType.Undefined;
}
exports.parseTransactionType = parseTransactionType;
//# sourceMappingURL=helper.js.map