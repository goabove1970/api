#!/bin/bash

# Database Setup Script for Dinero Main API
# This script sets up the PostgreSQL database for local development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database configuration (matches app.config.ts LOCAL_CONFIG)
DB_HOST="127.0.0.1"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"
DB_PASSWORD="admin"
DB_SCHEMA="public"

echo -e "${GREEN}Dinero Main API - Database Setup${NC}"
echo "=================================="
echo ""

# Check if PostgreSQL tools are available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: PostgreSQL client (psql) is not installed or not in PATH${NC}"
    echo ""
    echo "Please install PostgreSQL:"
    echo ""
    echo "On macOS with Homebrew:"
    echo "  brew install postgresql@15"
    echo "  brew services start postgresql@15"
    echo ""
    echo "Or download Postgres.app from: https://postgresapp.com/"
    echo "  (Make sure to add it to your PATH as shown in the app)"
    echo ""
    exit 1
fi

# Check if PostgreSQL is running
echo -e "${YELLOW}Checking PostgreSQL connection...${NC}"
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" > /dev/null 2>&1; then
    echo -e "${RED}Error: PostgreSQL is not running or not accessible at $DB_HOST:$DB_PORT${NC}"
    echo "Please start PostgreSQL and try again."
    echo ""
    echo "On macOS with Homebrew:"
    echo "  brew services start postgresql@15"
    echo ""
    echo "Or using Postgres.app, make sure it's running."
    exit 1
fi

echo -e "${GREEN}✓ PostgreSQL is running${NC}"
echo ""

# Check if database exists, create if not
echo -e "${YELLOW}Checking database '$DB_NAME'...${NC}"
if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo -e "${GREEN}✓ Database '$DB_NAME' exists${NC}"
else
    echo -e "${YELLOW}Creating database '$DB_NAME'...${NC}"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;" || {
        echo -e "${RED}Error: Failed to create database${NC}"
        exit 1
    }
    echo -e "${GREEN}✓ Database created${NC}"
fi
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SCHEMA_FILE="$SCRIPT_DIR/../database/schema.sql"

# Check if schema file exists
if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}Error: Schema file not found at $SCHEMA_FILE${NC}"
    exit 1
fi

# Run schema file
echo -e "${YELLOW}Creating database schema...${NC}"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCHEMA_FILE" || {
    echo -e "${RED}Error: Failed to create schema${NC}"
    exit 1
}

echo -e "${GREEN}✓ Database schema created successfully${NC}"
echo ""

# Verify tables were created
echo -e "${YELLOW}Verifying tables...${NC}"
TABLE_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_SCHEMA' AND table_name IN ('account', 'users', 'user_account', 'categories', 'business', 'transactions', 'session');")

if [ "$TABLE_COUNT" -eq 7 ]; then
    echo -e "${GREEN}✓ All 7 tables created successfully${NC}"
    echo ""
    echo -e "${GREEN}Database setup complete!${NC}"
    echo ""
    echo "You can now start the API server with:"
    echo "  cd api && NODE_ENV=development npm start"
else
    echo -e "${YELLOW}Warning: Expected 7 tables, found $TABLE_COUNT${NC}"
    echo "Some tables may not have been created. Please check the schema file."
fi

