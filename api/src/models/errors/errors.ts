export interface ErrorBase {
  error?: string;
  errorCode?: number;
}

export class TransactionRequestError implements ErrorBase {
  error: string = 'could not extract transaction request arguments';
}

export class UserRequestError implements ErrorBase {
  error: string = 'could not extract user request arguments';
}

export class AccountRequestError implements ErrorBase {
  error: string = 'could not extract account request arguments';

  constructor(error?: string) {
    if (error) {
      this.error = error;
    }
  }
}
