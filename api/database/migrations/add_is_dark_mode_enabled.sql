-- Migration: Add is_dark_mode_enabled column to users table
-- This migration adds the is_dark_mode_enabled column to existing databases
-- Run this script if you have an existing database that needs to be updated

-- Add the column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'is_dark_mode_enabled'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN is_dark_mode_enabled BOOLEAN DEFAULT FALSE;
        
        RAISE NOTICE 'Column is_dark_mode_enabled added to users table';
    ELSE
        RAISE NOTICE 'Column is_dark_mode_enabled already exists in users table';
    END IF;
END $$;

