export interface ErrorBase {
    message?: string;
    errorCode?: number;
}

export class TransactionRequestError implements ErrorBase {

    message: 'could not extract request arguments';
}