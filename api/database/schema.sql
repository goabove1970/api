-- Dinero Main API Database Schema
-- PostgreSQL Database Setup Script

-- Create account table
CREATE TABLE IF NOT EXISTS public.account (
    account_id VARCHAR PRIMARY KEY,
    bank_name VARCHAR,
    create_date TIMESTAMP,
    status INTEGER DEFAULT 0,
    service_comment TEXT,
    account_type INTEGER DEFAULT 0,
    card_number VARCHAR,
    card_expiration TIMESTAMP,
    account_alias VARCHAR,
    bank_routing_number VARCHAR,
    bank_account_number VARCHAR
);

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    user_id VARCHAR PRIMARY KEY,
    first_name VARCHAR,
    last_name VARCHAR,
    ssn VARCHAR,
    login VARCHAR UNIQUE,
    password VARCHAR,
    email VARCHAR,
    dob DATE,
    last_login TIMESTAMP,
    account_created TIMESTAMP,
    service_comment TEXT,
    status INTEGER DEFAULT 0
);

-- Create user_account link table
CREATE TABLE IF NOT EXISTS public.user_account (
    user_id VARCHAR NOT NULL,
    account_id VARCHAR NOT NULL,
    PRIMARY KEY (user_id, account_id),
    FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES public.account(account_id) ON DELETE CASCADE
);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    category_id VARCHAR PRIMARY KEY,
    caption VARCHAR NOT NULL,
    parent_category_id VARCHAR,
    user_id VARCHAR,
    category_type INTEGER DEFAULT 0,
    FOREIGN KEY (parent_category_id) REFERENCES public.categories(category_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE
);

-- Create business table
CREATE TABLE IF NOT EXISTS public.business (
    business_id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    default_category_id VARCHAR,
    regexps TEXT,
    FOREIGN KEY (default_category_id) REFERENCES public.categories(category_id) ON DELETE SET NULL
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    transaction_id VARCHAR PRIMARY KEY,
    account_id VARCHAR NOT NULL,
    imported_date TIMESTAMP,
    category_id VARCHAR,
    user_comment TEXT,
    override_posting_date TIMESTAMP,
    override_description TEXT,
    service_type INTEGER,
    override_category VARCHAR,
    transaction_status INTEGER DEFAULT 0,
    processing_status INTEGER DEFAULT 0,
    business_id VARCHAR,
    -- Chase transaction fields
    chase_details VARCHAR,
    chase_posting_date TIMESTAMP,
    chase_description TEXT,
    chase_amount NUMERIC(15, 2),
    chase_type VARCHAR,
    chase_balance NUMERIC(15, 2),
    chase_check_or_slip VARCHAR,
    chase_credit_card_transaction_type INTEGER,
    chase_bank_defined_category VARCHAR,
    FOREIGN KEY (account_id) REFERENCES public.account(account_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES public.categories(category_id) ON DELETE SET NULL,
    FOREIGN KEY (business_id) REFERENCES public.business(business_id) ON DELETE SET NULL
);

-- Create session table
CREATE TABLE IF NOT EXISTS public.session (
    session_id VARCHAR PRIMARY KEY,
    login_timestamp TIMESTAMP,
    session_data TEXT,
    user_id VARCHAR,
    FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_account_user_id ON public.user_account(user_id);
CREATE INDEX IF NOT EXISTS idx_account_account_id ON public.user_account(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_business_id ON public.transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_transactions_posting_date ON public.transactions(chase_posting_date);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_session_user_id ON public.session(user_id);

