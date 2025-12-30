import { ErrorCode, getErrorCode } from '@models/errors/ErrorCodes';

export interface FormattedError {
    error: string;
    errorCode: ErrorCode;
}

/**
 * Format error into user-friendly message with error code
 */
export function formatError(error: any, defaultCode: ErrorCode = ErrorCode.INTERNAL_ERROR): FormattedError {
    if (!error) {
        return {
            error: 'An error occurred',
            errorCode: defaultCode,
        };
    }
    
    let errorMsg = '';
    
    if (error && typeof error === 'object') {
        errorMsg = (error as any).errorMessage || 
                  (error as any).message || 
                  (error instanceof Error ? error.message : '') || 
                  String(error);
    } else if (error instanceof Error) {
        errorMsg = error.message || String(error);
    } else {
        errorMsg = String(error);
    }
    
    // Get error code
    const errorCode = getErrorCode(error, defaultCode);
    
    // Format error message based on error code
    let formattedMsg = errorMsg;
    
    // Clean up error message
    formattedMsg = formattedMsg.replace(/^Error:\s*/i, '');
    formattedMsg = formattedMsg.replace(/^DatabaseError:\s*/i, '');
    formattedMsg = formattedMsg.replace(/^ValidationError:\s*/i, '');
    formattedMsg = formattedMsg.replace(/^SessionError:\s*/i, '');
    formattedMsg = formattedMsg.replace(/^AggregateError:\s*/i, '');
    // Remove stack trace-like content
    formattedMsg = formattedMsg.split('\n')[0].trim();
    
    // Override message for specific error codes
    switch (errorCode) {
        case ErrorCode.INVALID_CREDENTIALS:
        case ErrorCode.USER_NOT_FOUND:
            // For security, use generic message for authentication failures
            formattedMsg = 'Invalid login credentials';
            break;
        case ErrorCode.SESSION_SERVICE_UNAVAILABLE:
            formattedMsg = 'Session service is not available. Please try again later.';
            break;
        case ErrorCode.SERVICE_UNAVAILABLE:
            formattedMsg = 'Service is not available. Please try again later.';
            break;
        case ErrorCode.ACCOUNT_NOT_FOUND:
            formattedMsg = formattedMsg || 'Account not found';
            break;
        case ErrorCode.SESSION_NOT_FOUND:
            formattedMsg = formattedMsg || 'Session not found';
            break;
        case ErrorCode.SESSION_EXPIRED:
            formattedMsg = formattedMsg || 'Session has expired';
            break;
        case ErrorCode.ACCOUNT_ALREADY_LINKED:
            formattedMsg = formattedMsg || 'This account has been already linked to this user';
            break;
        case ErrorCode.ACCOUNT_NOT_LINKED:
            formattedMsg = formattedMsg || 'This account has been already unlinked from this user';
            break;
        case ErrorCode.OLD_PASSWORD_INCORRECT:
            formattedMsg = formattedMsg || 'Error updating user password, old password could not be verified';
            break;
        case ErrorCode.PASSWORD_TOO_SHORT:
            formattedMsg = formattedMsg || 'Password can not be less than 8 characters';
            break;
        case ErrorCode.MISSING_REQUIRED_FIELD:
            // Keep the original message as it's usually descriptive
            break;
        default:
            // Use cleaned message or default
            if (!formattedMsg || formattedMsg === 'undefined' || formattedMsg === 'null') {
                formattedMsg = 'An error occurred';
            }
    }
    
    return {
        error: formattedMsg,
        errorCode: errorCode,
    };
}

