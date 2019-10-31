export class ErrorBase {
    constructor(errorMesage?: string) {
        this.error = errorMesage;
    }
    error?: string;
    errorCode?: number;
}

export class TransactionError extends ErrorBase {
    constructor(errorMesage?: string) {
        super(errorMesage || 'could not process transaction request');
    }
}

export class UserError extends ErrorBase {
    constructor(errorMesage?: string) {
        super(errorMesage || 'could not process user request');
    }
}

export class AccountError extends ErrorBase {
    constructor(errorMesage?: string) {
        super(errorMesage || 'could not process account request');
    }
}

export class CategoryError extends ErrorBase {
    constructor(errorMesage?: string) {
        super(errorMesage || 'could not process category request');
    }
}
