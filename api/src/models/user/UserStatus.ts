/**
 * UserStatus - Bit flag enum for user account status
 * Values are powers of 2 to allow combining multiple statuses
 * Use bitwise AND (&) to check for specific statuses
 * 
 * Examples:
 * - status = 1 → Active only
 * - status = 3 → Active (1) + Deactivated (2)
 * - status = 17 → Active (1) + Suspended (16)
 */
export enum UserStatus {
  // Core Statuses (1-8)
  /** User account is active and can use the system */
  Active = 1,
  /** User account is deactivated (soft delete) */
  Deactivated = 2,
  /** User account is locked (e.g., too many failed login attempts) */
  Locked = 4,
  /** User account is created but not yet activated (default for new users) */
  ActivationPending = 8,

  // Account Management Statuses (16-64)
  /** Account is suspended due to suspicious activity or compliance issues */
  Suspended = 16,
  /** Account is permanently closed and cannot be reopened */
  Closed = 32,
  /** Account has restricted access (limited functionality) */
  Restricted = 64,

  // Verification Statuses (128-512)
  /** User email address has not been verified */
  EmailUnverified = 128,
  /** User phone number has not been verified */
  PhoneUnverified = 256,
  /** Know Your Customer (KYC) verification is pending */
  KYC_Pending = 512,

  // Compliance & Security Statuses (1024-4096)
  /** KYC verification has been completed successfully */
  KYC_Verified = 1024,
  /** Account has been flagged for potential fraud */
  FraudFlagged = 2048,
  /** User password has expired and needs to be changed */
  PasswordExpired = 4096,

  // Legal & Terms Statuses (8192+)
  /** User has not accepted the latest terms and conditions */
  TermsNotAccepted = 8192,
}
