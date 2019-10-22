export enum ChaseTransactionType {
  AccountTransfer = 'ACCT_XFER',
  AchCredit = 'ACH_CREDIT',
  AchDebit = 'ACH_DEBIT',
  Atm = 'ATM',
  AtmDeposit = 'ATM_DEPOSIT',
  ChaseToPartner = 'CHASE_TO_PARTNERFI',
  CheckDeposit = 'CHECK_DEPOSIT',
  CheckPaid = 'CHECK_PAID',
  DebitCard = 'DEBIT_CARD',
  Deposit = 'DEPOSIT',
  FeeTransaction = 'FEE_TRANSACTION',
  MiscCredit = 'MISC_CREDIT',
  MiscDebit = 'MISC_DEBIT',
  PartnerToChase = 'PARTNERFI_TO_CHASE',
  QuickPayCredit = 'QUICKPAY_CREDIT',
  QuickPayDebit = 'QUICKPAY_DEBIT',
  WireOutgoing = 'WIRE_OUTGOING',
  WireIngoing = 'WIRE_INGOING',
  Undefined = 'undefined',
}
