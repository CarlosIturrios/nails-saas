-- Add a persisted visual template for dynamic quotes
ALTER TABLE "OrganizationConfig"
ADD COLUMN "quoteTemplate" TEXT NOT NULL DEFAULT 'modern';
