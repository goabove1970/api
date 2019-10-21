import { TransactionOriginType } from "../../models/transaction/transaction-origin-type";
import { ParseError } from "../../models/parsers/parse-error";
import { TransactionType } from "../../models/transaction/transaction-type";

export function parseNumer(line: string): number | undefined {
    try{
        const number = Number.parseFloat(line);
    } catch (error) {
        return undefined;
    }
}

export function parseAmount(line: string): number | undefined {
    return parseNumer(line);
}

export function parseBalance(line: string): number | undefined {
    return parseNumer(line);
}

export function parseChaseTransDetails(details: string): TransactionOriginType {
  switch (details) {
    case 'DEBIT':
      return TransactionOriginType.Debit;
    case 'CREDIT':
      return TransactionOriginType.Credit;
    case 'CHECK':
      return TransactionOriginType.Check;
    case 'DSLIP':
      return TransactionOriginType.Dslip;
  }
  throw {
      part: 'TransactionOriginType',
      message: `Could not parse ${details} TransactionOriginType`

  } as ParseError;
}

export function parseTransactionType(line: string): TransactionType {
    switch (line) {
      case 'ACCT_XFER':
        return TransactionType.AccountTransfer;
      case 'ACH_CREDIT':
        return TransactionType.AchCredit;
      case 'ACH_DEBIT':
        return TransactionType.AchDebit;
      case 'ATM':
        return TransactionType.Atm;
        case 'ATM_DEPOSIT':
        return TransactionType.AtmDeposit;
      case 'CASE_TO_PARTNERFI':
        return TransactionType.ChaseToPartner;
      case 'CHECK_DEPOSIT':
        return TransactionType.CheckDeposit;
      case 'CHECK_PAID':
        return TransactionType.CheckPaid;
      case 'DEBIT_CARD':
          return TransactionType.DebitCard;
      case 'DEPOSIT':
          return TransactionType.Deposit;
      case 'FEE_TRANSACTION':
          return TransactionType.FeeTransaction;
      case 'MISC_CREDIT':
          return TransactionType.MiscCredit;
      case 'MISC_DEBIT':
          return TransactionType.MiscDebit;
      case 'PARTNERFI_TO_CHASE':
          return TransactionType.PartnerToChase;
      case 'QUICKPAY_CREDIT':
          return TransactionType.QuickPayCredit;
      case 'QUICKPAY_DEBIT':
          return TransactionType.QuickPayDebit;
      case 'WIRE_OUTGOING':
          return TransactionType.WireOutgoing;
      case 'WIRE_INGOING':
          return TransactionType.WireIngoing;
    }
    throw {
        part: 'TransactionType',
        message: `Could not parse ${line} TransactionType`

    } as ParseError;
  }