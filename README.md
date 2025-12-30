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
- PostgreSQL database (for production)
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

### Database Configuration

Update `app.config.ts` with your PostgreSQL connection details:
- Host
- Port
- Database name
- Username
- Password
- Schema

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

### Start in development mode:

```bash
npm run start-local
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
- Bank account CRUD operations
- Account-to-user assignment

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
