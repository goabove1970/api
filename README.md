# Dinero Main API

A Node.js/Express REST API for managing financial transactions, accounts, users, categories, and spending analytics. This API provides endpoints for transaction management, user authentication, account management, spending analysis, and bank synchronization.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Building](#building)
- [Running](#running)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Development](#development)
- [Dependencies](#dependencies)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [License](#license)

## Features

- **User Management**: User authentication, registration, and session management
- **Account Management**: Bank account creation, updates, and linking to users
- **Transaction Management**: Import, categorize, and manage financial transactions
- **Category Management**: Organize transactions with custom categories and subcategories
- **Business Recognition**: Automatic business/merchant recognition from transaction descriptions
- **Spending Analytics**: Monthly spending reports, category breakdowns, and spending progression
- **Bank Synchronization**: Integration with external bank services for transaction import
- **Chase Bank Integration**: Parser for Chase bank CSV transaction files

## Prerequisites

- Node.js (v12 or higher recommended)
- npm (v6 or higher)
- PostgreSQL database (v12 or higher)
- TypeScript (v4.9.5)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd api
```

2. Navigate to the API directory:
```bash
cd api
```

3. Install dependencies:
```bash
npm install
```

## Configuration

The application uses environment-based configuration. Configuration is managed in `app.config.ts`:

- **Development**: Uses local PostgreSQL database (127.0.0.1:5432)
- **Production**: Uses remote PostgreSQL database

Set `NODE_ENV=development` for local development or leave unset for production.

### Environment Variables

- `NODE_ENV`: Set to `development` for local development
- `PORT`: Server port (default: 9000)

## Database Setup

### Prerequisites

- PostgreSQL installed and running locally
- Default local configuration:
  - **Host**: `127.0.0.1`
  - **Port**: `5432`
  - **User**: `postgres`
  - **Password**: `admin`
  - **Database**: `postgres`
  - **Schema**: `public`

### Installing PostgreSQL

#### macOS (Homebrew)
```bash
brew install postgresql@15
brew services start postgresql@15
```

#### macOS (Postgres.app)
1. Download from: https://postgresapp.com/
2. Install and start the app
3. Add PostgreSQL to your PATH (instructions shown in app)

#### Linux
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Setting Up the Database

1. **Set PostgreSQL password** (if not already set):
```bash
psql postgres
```
Then in the PostgreSQL prompt:
```sql
ALTER USER postgres WITH PASSWORD 'admin';
\q
```

2. **Run the database setup script**:
```bash
cd api
./scripts/setup-db.sh
```

The script will:
- Check if PostgreSQL is running
- Create the database if it doesn't exist
- Create all required tables (account, users, user_account, categories, business, transactions, session)
- Create indexes for better performance

3. **Manual setup** (alternative):
```bash
psql -U postgres -d postgres -f database/schema.sql
```

### Database Schema

The database includes the following tables:
- **account**: Bank account information
- **users**: User accounts and authentication
- **user_account**: Many-to-many relationship between users and accounts
- **categories**: Transaction categories with parent/child relationships
- **business**: Business/merchant information for transaction recognition
- **transactions**: Financial transactions with Chase bank data
- **session**: User session management

### Verifying Database Setup

```bash
psql -U postgres -d postgres
```

Then in PostgreSQL:
```sql
\dt  -- List all tables
SELECT COUNT(*) FROM account;  -- Should return 0 (empty table)
\q
```

### Database Configuration

To change database settings, update `LOCAL_CONFIG` in `app.config.ts`:
```typescript
const LOCAL_CONFIG: ApplicationConfig = {
    PgConfig: {
        host: '127.0.0.1',
        port: 5432,
        login: 'postgres',
        password: 'admin',
        database: 'postgres',
        schema: 'public',
    },
    // ...
};
```

## Building

Build the TypeScript project:

```bash
npm run build
```

This compiles TypeScript files from `src/` to `dist/`.

For TypeScript compilation only:

```bash
npm run build:ts
```

## Running

### Start the server:

```bash
npm start
```

### Start in development mode (uses local database):

```bash
npm run start-local
```

Or explicitly:
```bash
NODE_ENV=development npm start
```

**Important**: Make sure PostgreSQL is running and the database is set up before starting the server:
```bash
# Check if PostgreSQL is running
pg_isready

# If not running, start it (macOS with Homebrew):
brew services start postgresql@15
```

The API will be available at `http://localhost:9000` (or the port specified in `PORT` environment variable).

## Testing

### Run all tests:

```bash
npm test
```

### Run tests with coverage:

```bash
npm run test:jest
```

### Run tests in watch mode:

```bash
npm run test:watch
```

### Run tests with coverage in watch mode:

```bash
npm run test:cover:watch
```

### Test Coverage

The project includes comprehensive test coverage for:
- Account Controller
- Business Controller
- Category Controller
- Transaction Controller
- User Controller
- Spendings Controller
- Session Controller
- Bank Sync Controller
- Parser Controller

Tests are located in `src/test/` directory.

## Project Structure

```
api/
├── src/
│   ├── controllers/          # Business logic controllers
│   │   ├── account-controller/
│   │   ├── auth-controller/
│   │   ├── bank-sync-controller/
│   │   ├── business-controller/
│   │   ├── category-controller/
│   │   ├── data-controller/   # Database persistence layer
│   │   ├── parser-controller/ # CSV/transaction parsing
│   │   ├── session-controller/
│   │   ├── spendings-controller/
│   │   ├── transaction-controller/
│   │   └── user-controller/
│   ├── models/               # TypeScript models and interfaces
│   ├── routes/               # Express route handlers
│   ├── test/                 # Test files
│   └── utils/                 # Utility functions
├── bin/
│   └── www.ts               # Application entry point
├── dist/                     # Compiled JavaScript (generated)
├── app.ts                    # Express app configuration
├── app.config.ts            # Application configuration
├── package.json             # Dependencies and scripts
└── tsconfig.json            # TypeScript configuration
```

## API Endpoints

### Users (`/users`)
- User registration, authentication, and management
- Account linking/unlinking
- Session management

### Accounts (`/accounts`)

#### Read Accounts
**Action**: `read-accounts`

Get accounts by user ID or account ID.

**Request Example**:
```json
{
  "action": "read-accounts",
  "args": {
    "userId": "098be70d-f5c1-0799-e0b2-9226eb0c4f1d"
  }
}
```

**Response Example**:
```json
{
  "action": "read-accounts",
  "payload": {
    "count": 1,
    "accounts": [
      {
        "accountId": "77cbb0cf-c614-573c-d124-6e72872471d4",
        "bankName": "JP Morgan Chase",
        "bankRoutingNumber": "233",
        "bankAccountNumber": "1789",
        "accountType": 4,
        "status": 1
      }
    ]
  }
}
```

#### Create Account
**Action**: `create-account`

Create a new bank account and automatically link it to a user.

**Request Example**:
```json
{
  "action": "create-account",
  "args": {
    "userId": "098be70d-f5c1-0799-e0b2-9226eb0c4f1d",
    "bankRoutingNumber": "233",
    "bankAccountNumber": "1789",
    "bankName": "JP Morgan Chase",
    "accountType": 4,
    "alias": "My Checking Account"
  }
}
```

**Response Example**:
```json
{
  "action": "create-account",
  "payload": {
    "accountId": "77cbb0cf-c614-573c-d124-6e72872471d4"
  }
}
```

**Required Fields**:
- `userId`: User ID to link the account to
- `bankRoutingNumber`: Bank routing number
- `bankAccountNumber`: Bank account number
- `bankName`: Name of the bank

**Optional Fields**:
- `accountType`: Account type (0=Empty, 1=Credit, 2=Debit, 4=Checking, 8=Savings)
- `alias`: Custom name for the account

#### Update Account
**Action**: `update`

Update account information.

**Request Example**:
```json
{
  "action": "update",
  "args": {
    "accountId": "77cbb0cf-c614-573c-d124-6e72872471d4",
    "bankName": "Chase",
    "alias": "Updated Account Name"
  }
}
```

**Response Example**:
```json
{
  "action": "update",
  "payload": {
    "accountId": "77cbb0cf-c614-573c-d124-6e72872471d4"
  }
}
```

**Error Response Example**:
```json
{
  "action": "update",
  "payload": {},
  "error": "Account not found. No account exists with ID: invalid-id"
}
```

#### Delete Account
**Action**: `delete-account`

Delete or deactivate an account. Supports two modes:
- **Soft Delete** (default): Deactivates the account and adds a service comment. The account record remains in the database.
- **Hard Delete**: Permanently removes the account from the database.

**Soft Delete Request Example**:
```json
{
  "action": "delete-account",
  "args": {
    "accountId": "77cbb0cf-c614-573c-d124-6e72872471d4",
    "serviceComment": "Account closed by user request",
    "deleteRecord": false
  }
}
```

**Hard Delete Request Example**:
```json
{
  "action": "delete-account",
  "args": {
    "accountId": "77cbb0cf-c614-573c-d124-6e72872471d4",
    "deleteRecord": true
  }
}
```

**Response Example** (Success):
```json
{
  "action": "delete-account",
  "payload": {
    "accountId": "77cbb0cf-c614-573c-d124-6e72872471d4"
  }
}
```

**Error Response Example**:
```json
{
  "action": "delete-account",
  "payload": {},
  "error": "Account not found. No account exists with ID: invalid-id"
}
```

**Parameters**:
- `accountId` (required): The account ID to delete
- `serviceComment` (optional): Comment to add when soft deleting
- `deleteRecord` (optional, default: `false`): Set to `true` for hard delete, `false` for soft delete (deactivation)

### Transactions (`/transactions`)
- Transaction import (CSV and individual)
- Transaction CRUD operations
- Business recognition
- Transaction categorization

### Categories (`/categories`)
- Category CRUD operations
- Parent/child category relationships

### Businesses (`/business`)
- Business/merchant management
- Regex pattern matching for transaction recognition

### Spendings (`/spendings`)
- Monthly spending reports
- Category-based spending analysis
- Spending progression over time
- Annual balance reports

### Session (`/session`)
- Session initialization
- Session validation
- Session extension
- Session termination

### Bank Connections (`/bank-connections`)
- Bank account synchronization
- Transaction polling from external bank services

## Development

### Code Formatting

Check code formatting:
```bash
npm run prettier:check
```

Format code:
```bash
npm run prettier:write
```

### Version Bumping

Bump patch version:
```bash
npm run patch
```

Bump minor version:
```bash
npm run minor
```

Bump major version:
```bash
npm run major
```

### Module Aliases

The project uses module aliases for cleaner imports:
- `@root/*` - Root directory
- `@src/*` - Source directory
- `@models/*` - Models directory
- `@routes/*` - Routes directory
- `@utils/*` - Utils directory
- `@controllers/*` - Controllers directory
- `@mock/*` - Test mocks directory

## Dependencies

### Main Dependencies
- **express**: Web framework
- **body-parser**: Request body parsing
- **cors**: Cross-origin resource sharing
- **cookie-parser**: Cookie parsing
- **winston**: Logging
- **moment**: Date manipulation
- **ts-postgres**: PostgreSQL client
- **module-alias**: Module path aliasing
- **password-hash**: Password hashing
- **multiparty**: File upload handling

### Development Dependencies
- **typescript**: TypeScript compiler
- **jest**: Testing framework
- **ts-jest**: TypeScript support for Jest
- **@types/jest**: Jest type definitions
- **@types/node**: Node.js type definitions
- **eslint**: Linting
- **tslint**: TypeScript linting
- **prettier**: Code formatting

## Scripts

- `npm start` - Start the production server
- `npm run start-local` - Start in development mode
- `npm run build` - Build the project
- `npm run build:ts` - Compile TypeScript
- `npm test` - Run tests
- `npm run test:jest` - Run tests with coverage
- `npm run test:watch` - Run tests in watch mode
- `npm run prettier:check` - Check code formatting
- `npm run prettier:write` - Format code
- `npm run patch` - Bump patch version
- `npm run minor` - Bump minor version
- `npm run major` - Bump major version

## Contributing

1. Create a feature branch
2. Make your changes
3. Add tests for new functionality
4. Ensure all tests pass: `npm test`
5. Format code: `npm run prettier:write`
6. Submit a pull request

## License

This project is private and proprietary.

## Support

For issues and questions, please contact the development team.
