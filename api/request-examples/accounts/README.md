# Account API Examples

This directory contains example requests for the Account API endpoints.

## Endpoints

All account endpoints are available at: `POST http://localhost:9000/accounts`

### 1. Read Accounts

**File**: `read-accounts.json`

Get all accounts for a user or a specific account by ID.

```bash
curl -X POST http://localhost:9000/accounts \
  -H "Content-Type: application/json" \
  -d @read-accounts.json
```

**Response**:
```json
{
  "action": "read-accounts",
  "payload": {
    "count": 1,
    "accounts": [...]
  }
}
```

### 2. Create Account

**File**: `create-account.json`

Create a new bank account and link it to a user.

```bash
curl -X POST http://localhost:9000/accounts \
  -H "Content-Type: application/json" \
  -d @create-account.json
```

**Response**:
```json
{
  "action": "create-account",
  "payload": {
    "accountId": "77cbb0cf-c614-573c-d124-6e72872471d4"
  }
}
```

### 3. Update Account

**File**: `update-account.json`

Update account information (bank name, alias, etc.).

```bash
curl -X POST http://localhost:9000/accounts \
  -H "Content-Type: application/json" \
  -d @update-account.json
```

**Response**:
```json
{
  "action": "update",
  "payload": {
    "accountId": "77cbb0cf-c614-573c-d124-6e72872471d4"
  }
}
```

### 4. Delete Account (Soft Delete)

**File**: `delete-account-soft.json`

Deactivate an account without removing it from the database. The account is marked as deactivated and a service comment is added.

```bash
curl -X POST http://localhost:9000/accounts \
  -H "Content-Type: application/json" \
  -d @delete-account-soft.json
```

**Response**:
```json
{
  "action": "delete-account",
  "payload": {
    "accountId": "77cbb0cf-c614-573c-d124-6e72872471d4"
  }
}
```

### 5. Delete Account (Hard Delete)

**File**: `delete-account-hard.json`

Permanently remove an account from the database. **Warning**: This action cannot be undone.

```bash
curl -X POST http://localhost:9000/accounts \
  -H "Content-Type: application/json" \
  -d @delete-account-hard.json
```

**Response**:
```json
{
  "action": "delete-account",
  "payload": {
    "accountId": "77cbb0cf-c614-573c-d124-6e72872471d4"
  }
}
```

## Error Responses

All endpoints return user-friendly error messages:

```json
{
  "action": "delete-account",
  "payload": {},
  "error": "Account not found. No account exists with ID: invalid-id"
}
```

## Account Types

- `0` - Empty
- `1` - Credit
- `2` - Debit
- `4` - Checking
- `8` - Savings

## Notes

- All account operations require a valid `accountId` or `userId`
- Account creation automatically links the account to the specified user
- Soft delete (default) preserves account history, hard delete removes all records
- Update operations only modify the fields provided in the request

