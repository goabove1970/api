export enum SessionRequestType {
    Extend = 'extend',
    Terminate = 'terminate',
    Validate = 'validate',
    Init = 'init',
}

export type SessionState = 'ACTIVE' | 'EXPIRED';

export interface ResponseBase {
    error?: string;
    errorCode?: number;
    payload?: {
        sessionId?: string;
        message?: string;
        state?: SessionState;
        loginTimestamp?: Date;
    };
}

export interface SessionRequest {
    action?: SessionRequestType;
    args?: SessionArgs;
}

export interface SessionResponse extends ResponseBase {
    action?: SessionRequestType;
    /** Session expiration date/time. Present in all responses except when state is "EXPIRED" */
    sessionExpires?: Date | string;
}

export interface SessionArgs {
    sessionId?: string;
    sessionData?: string;
    userId?: string;
    loginTimestamp?: Date;
}
