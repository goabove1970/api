/**
 * Error codes for API responses
 * 
 * Error code ranges:
 * - 1000-1999: User/Authentication errors
 * - 2000-2999: Account errors
 * - 3000-3999: Session errors
 * - 4000-4999: Database errors
 * - 5000-5999: Validation errors
 * - 6000-6999: Service/Connection errors
 * - 7000-7999: Transaction errors
 * - 8000-8999: Other errors
 */

export enum ErrorCode {
    // User/Authentication errors (1000-1999)
    USER_NOT_FOUND = 1001,
    INVALID_CREDENTIALS = 1002,
    USER_ALREADY_EXISTS = 1003,
    USER_ACCOUNT_INACTIVE = 1004,
    PASSWORD_TOO_SHORT = 1005,
    PASSWORD_VALIDATION_FAILED = 1006,
    USER_CREATION_FAILED = 1007,
    USER_UPDATE_FAILED = 1008,
    USER_DELETE_FAILED = 1009,
    PASSWORD_UPDATE_FAILED = 1010,
    OLD_PASSWORD_INCORRECT = 1011,
    
    // Account errors (2000-2999)
    ACCOUNT_NOT_FOUND = 2001,
    ACCOUNT_ALREADY_EXISTS = 2002,
    ACCOUNT_CREATION_FAILED = 2003,
    ACCOUNT_UPDATE_FAILED = 2004,
    ACCOUNT_DELETE_FAILED = 2005,
    ACCOUNT_ALREADY_LINKED = 2006,
    ACCOUNT_NOT_LINKED = 2007,
    ACCOUNT_LINK_FAILED = 2008,
    ACCOUNT_UNLINK_FAILED = 2009,
    
    // Session errors (3000-3999)
    SESSION_NOT_FOUND = 3001,
    SESSION_EXPIRED = 3002,
    SESSION_INIT_FAILED = 3003,
    SESSION_EXTEND_FAILED = 3004,
    SESSION_VALIDATE_FAILED = 3005,
    SESSION_TERMINATE_FAILED = 3006,
    SESSION_INVALID = 3007,
    
    // Database errors (4000-4999)
    DATABASE_CONNECTION_ERROR = 4001,
    DATABASE_QUERY_ERROR = 4002,
    DATABASE_RECORD_NOT_FOUND = 4003,
    DATABASE_INSERT_FAILED = 4004,
    DATABASE_UPDATE_FAILED = 4005,
    DATABASE_DELETE_FAILED = 4006,
    DATABASE_TRANSACTION_ERROR = 4007,
    
    // Validation errors (5000-5999)
    VALIDATION_ERROR = 5001,
    MISSING_REQUIRED_FIELD = 5002,
    INVALID_FIELD_VALUE = 5003,
    INVALID_REQUEST_FORMAT = 5004,
    INVALID_DATE_FORMAT = 5005,
    INVALID_EMAIL_FORMAT = 5006,
    INVALID_UUID_FORMAT = 5007,
    
    // Service/Connection errors (6000-6999)
    SERVICE_UNAVAILABLE = 6001,
    SESSION_SERVICE_UNAVAILABLE = 6002,
    BANK_SERVICE_UNAVAILABLE = 6003,
    CONNECTION_TIMEOUT = 6004,
    CONNECTION_REFUSED = 6005,
    SERVICE_ERROR = 6006,
    
    // Transaction errors (7000-7999)
    TRANSACTION_NOT_FOUND = 7001,
    TRANSACTION_CREATION_FAILED = 7002,
    TRANSACTION_UPDATE_FAILED = 7003,
    TRANSACTION_DELETE_FAILED = 7004,
    TRANSACTION_IMPORT_FAILED = 7005,
    TRANSACTION_PARSE_ERROR = 7006,
    
    // Other errors (8000-8999)
    INTERNAL_ERROR = 8001,
    UNKNOWN_ERROR = 8002,
    NOT_IMPLEMENTED = 8003,
    UNAUTHORIZED = 8004,
    FORBIDDEN = 8005,
    NOT_FOUND = 8006,
    METHOD_NOT_ALLOWED = 8007,
}

/**
 * Get error code based on error message/type
 */
export function getErrorCode(error: any, defaultCode: ErrorCode = ErrorCode.INTERNAL_ERROR): ErrorCode {
    if (!error) {
        return defaultCode;
    }
    
    let errorMsg = '';
    let errorCodeValue: any = null;
    
    if (error && typeof error === 'object') {
        errorMsg = (error as any).errorMessage || 
                  (error as any).message || 
                  (error instanceof Error ? error.message : '') || 
                  String(error);
        errorCodeValue = (error as any).errorCode || (error as any).code;
    } else if (error instanceof Error) {
        errorMsg = error.message || String(error);
    } else {
        errorMsg = String(error);
    }
    
    // Check error message patterns
    const lowerMsg = errorMsg.toLowerCase();
    
    // User/Authentication errors
    if (lowerMsg.includes('user not found') || lowerMsg.includes('could not find user')) {
        return ErrorCode.USER_NOT_FOUND;
    }
    if (lowerMsg.includes('invalid login credentials') || 
        lowerMsg.includes('could not validate user credentials') ||
        lowerMsg.includes('error validating user password')) {
        return ErrorCode.INVALID_CREDENTIALS;
    }
    if (lowerMsg.includes('user already exists')) {
        return ErrorCode.USER_ALREADY_EXISTS;
    }
    if (lowerMsg.includes('user account is inactive')) {
        return ErrorCode.USER_ACCOUNT_INACTIVE;
    }
    if (lowerMsg.includes('password can not be less than')) {
        return ErrorCode.PASSWORD_TOO_SHORT;
    }
    if (lowerMsg.includes('password') && lowerMsg.includes('validation')) {
        return ErrorCode.PASSWORD_VALIDATION_FAILED;
    }
    if (lowerMsg.includes('old password could not be verified') || 
        lowerMsg.includes('old password is incorrect')) {
        return ErrorCode.OLD_PASSWORD_INCORRECT;
    }
    
    // Account errors
    if (lowerMsg.includes('account not found') || 
        lowerMsg.includes('could not find account')) {
        return ErrorCode.ACCOUNT_NOT_FOUND;
    }
    if (lowerMsg.includes('account already linked')) {
        return ErrorCode.ACCOUNT_ALREADY_LINKED;
    }
    if (lowerMsg.includes('account not linked') || 
        lowerMsg.includes('already unlinked')) {
        return ErrorCode.ACCOUNT_NOT_LINKED;
    }
    if (lowerMsg.includes('could not find account record to link')) {
        return ErrorCode.ACCOUNT_LINK_FAILED;
    }
    
    // Session errors
    if (lowerMsg.includes('session not found') || 
        lowerMsg.includes('invalid session')) {
        return ErrorCode.SESSION_NOT_FOUND;
    }
    if (lowerMsg.includes('session expired') || 
        lowerMsg.includes('session has expired')) {
        return ErrorCode.SESSION_EXPIRED;
    }
    if (lowerMsg.includes('could not initilize new session') ||
        lowerMsg.includes('unable to create session')) {
        return ErrorCode.SESSION_INIT_FAILED;
    }
    
    // Database errors
    if (lowerMsg.includes('database') || 
        lowerMsg.includes('relation') || 
        lowerMsg.includes('column') ||
        lowerMsg.includes('could not find') && lowerMsg.includes('record')) {
        return ErrorCode.DATABASE_RECORD_NOT_FOUND;
    }
    
    // Service/Connection errors
    if (lowerMsg.includes('session service is not available') ||
        lowerMsg.includes('econnrefused') ||
        lowerMsg.includes('connection refused')) {
        return ErrorCode.SESSION_SERVICE_UNAVAILABLE;
    }
    if (lowerMsg.includes('service is not available') ||
        lowerMsg.includes('service unavailable')) {
        return ErrorCode.SERVICE_UNAVAILABLE;
    }
    if (lowerMsg.includes('timeout')) {
        return ErrorCode.CONNECTION_TIMEOUT;
    }
    
    // Validation errors
    if (lowerMsg.includes('validation') || 
        lowerMsg.includes('invalid') && lowerMsg.includes('format')) {
        return ErrorCode.VALIDATION_ERROR;
    }
    if (lowerMsg.includes('missing required') || 
        lowerMsg.includes('is not specified') ||
        lowerMsg.includes('can not be empty')) {
        return ErrorCode.MISSING_REQUIRED_FIELD;
    }
    
    // Check if error has an errorCode property
    if (errorCodeValue !== null && errorCodeValue !== undefined) {
        // If it's a valid ErrorCode, return it
        if (Object.values(ErrorCode).includes(errorCodeValue)) {
            return errorCodeValue as ErrorCode;
        }
    }
    
    return defaultCode;
}

