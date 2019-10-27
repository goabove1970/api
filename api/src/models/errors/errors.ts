export interface ErrorBase {
  message?: string;
  errorCode?: number;
}

export class TransactionRequestError implements ErrorBase {
  message: 'could not extract transaction request arguments';
}

export class UserRequestError implements ErrorBase {
  message: 'could not extract user request arguments';
}
