import { ResponseBase } from './Requests';

export type TransactionRequestType = 'read-transactions';

export interface TransactionRequest {
  action?: TransactionRequestType;
  args?: ReadTransactionArgs;
}

export interface TransactionResponse extends ResponseBase {
  action?: TransactionRequestType;
}

export interface ReadTransactionArgs {
  transactionId?: string;
  userId?: string;
  accountId?: string;
  startDate?: Date;
  endDate?: Date;
  count?: number;
  offset?: number;
}
