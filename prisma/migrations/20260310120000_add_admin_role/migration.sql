-- Add ADMIN role to UserRole enum
DO $$ BEGIN
  ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'ADMIN';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
