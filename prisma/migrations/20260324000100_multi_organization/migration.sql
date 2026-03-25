-- CreateEnum
CREATE TYPE "UserOrganizationRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateTable
CREATE TABLE "UserOrganization" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" "UserOrganizationRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserOrganization_pkey" PRIMARY KEY ("id")
);

-- Backfill existing user -> organization relations
INSERT INTO "UserOrganization" ("id", "userId", "organizationId", "role", "createdAt")
SELECT
    concat('uo_', md5("id" || "organizationId")),
    "id",
    "organizationId",
    CASE
        WHEN "role" = 'ADMIN' THEN 'ADMIN'::"UserOrganizationRole"
        ELSE 'MEMBER'::"UserOrganizationRole"
    END,
    CURRENT_TIMESTAMP
FROM "User"
WHERE "organizationId" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UserOrganization_userId_organizationId_key" ON "UserOrganization"("userId", "organizationId");

-- CreateIndex
CREATE INDEX "UserOrganization_organizationId_idx" ON "UserOrganization"("organizationId");

-- CreateIndex
CREATE INDEX "UserOrganization_userId_idx" ON "UserOrganization"("userId");

-- AddForeignKey
ALTER TABLE "UserOrganization" ADD CONSTRAINT "UserOrganization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOrganization" ADD CONSTRAINT "UserOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Remove old direct relationship
ALTER TABLE "User" DROP CONSTRAINT "User_organizationId_fkey";
DROP INDEX IF EXISTS "User_organizationId_idx";
ALTER TABLE "User" DROP COLUMN "organizationId";
