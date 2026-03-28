-- CreateEnum
CREATE TYPE "UserOrganizationPermissionProfile" AS ENUM (
  'FULL_SERVICE',
  'FRONT_DESK',
  'SALES_ONLY',
  'OPERATOR',
  'VIEW_ONLY'
);

-- Alter UserOrganizationRole safely by mapping old values to the new enum.
BEGIN;
CREATE TYPE "UserOrganizationRole_new" AS ENUM ('ORG_ADMIN', 'EMPLOYEE');
ALTER TABLE "public"."UserOrganization" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."UserOrganization"
  ALTER COLUMN "role" TYPE "UserOrganizationRole_new"
  USING (
    CASE
      WHEN "role"::text = 'ADMIN' THEN 'ORG_ADMIN'
      WHEN "role"::text = 'MEMBER' THEN 'EMPLOYEE'
      ELSE 'EMPLOYEE'
    END::"UserOrganizationRole_new"
  );
ALTER TYPE "public"."UserOrganizationRole" RENAME TO "UserOrganizationRole_old";
ALTER TYPE "public"."UserOrganizationRole_new" RENAME TO "UserOrganizationRole";
DROP TYPE "public"."UserOrganizationRole_old";
ALTER TABLE "public"."UserOrganization" ALTER COLUMN "role" SET DEFAULT 'EMPLOYEE';
COMMIT;

-- Alter UserRole safely by mapping old values to the new enum.
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('SUPER_ADMIN', 'SAAS_ADMIN', 'STANDARD_USER');
ALTER TABLE "public"."User"
  ALTER COLUMN "role" TYPE "UserRole_new"
  USING (
    CASE
      WHEN "role"::text = 'ADMIN' THEN 'SUPER_ADMIN'
      WHEN "role"::text = 'EMPLOYEE' THEN 'STANDARD_USER'
      ELSE 'STANDARD_USER'
    END::"UserRole_new"
  );
ALTER TYPE "public"."UserRole" RENAME TO "UserRole_old";
ALTER TYPE "public"."UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."UserOrganization"
  ADD COLUMN "permissionProfile" "UserOrganizationPermissionProfile" NOT NULL DEFAULT 'FULL_SERVICE',
  ALTER COLUMN "role" SET DEFAULT 'EMPLOYEE';
