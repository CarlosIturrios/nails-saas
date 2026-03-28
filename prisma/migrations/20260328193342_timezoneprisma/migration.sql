-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "defaultTimezone" TEXT NOT NULL DEFAULT 'UTC';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "timezone" TEXT;
