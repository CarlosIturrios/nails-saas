-- CreateEnum
CREATE TYPE "ExtraPricingType" AS ENUM ('PER_UNIT', 'FIXED');

-- CreateTable
CREATE TABLE "OrganizationConfig" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "businessType" TEXT NOT NULL DEFAULT 'general',
    "logoUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#1f2937',
    "secondaryColor" TEXT NOT NULL DEFAULT '#fffaf4',
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "language" TEXT NOT NULL DEFAULT 'es-MX',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" TEXT NOT NULL,
    "organizationConfigId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "multiSelect" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceOption" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtraOption" (
    "id" TEXT NOT NULL,
    "organizationConfigId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "pricingType" "ExtraPricingType" NOT NULL DEFAULT 'PER_UNIT',
    "includedQuantity" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtraOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessRules" (
    "id" TEXT NOT NULL,
    "organizationConfigId" TEXT NOT NULL,
    "maxSelectedCategories" INTEGER,
    "maxQuantityPerExtra" INTEGER,
    "maxTotalSelections" INTEGER,
    "extraPricingRules" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessRules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UIConfig" (
    "id" TEXT NOT NULL,
    "organizationConfigId" TEXT NOT NULL,
    "titles" JSONB,
    "texts" JSONB,
    "labels" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UIConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationConfig_organizationId_key" ON "OrganizationConfig"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationConfig_organizationId_idx" ON "OrganizationConfig"("organizationId");

-- CreateIndex
CREATE INDEX "ServiceCategory_organizationConfigId_sortOrder_idx" ON "ServiceCategory"("organizationConfigId", "sortOrder");

-- CreateIndex
CREATE INDEX "ServiceOption_categoryId_sortOrder_idx" ON "ServiceOption"("categoryId", "sortOrder");

-- CreateIndex
CREATE INDEX "ExtraOption_organizationConfigId_sortOrder_idx" ON "ExtraOption"("organizationConfigId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessRules_organizationConfigId_key" ON "BusinessRules"("organizationConfigId");

-- CreateIndex
CREATE UNIQUE INDEX "UIConfig_organizationConfigId_key" ON "UIConfig"("organizationConfigId");

-- AddForeignKey
ALTER TABLE "OrganizationConfig"
ADD CONSTRAINT "OrganizationConfig_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCategory"
ADD CONSTRAINT "ServiceCategory_organizationConfigId_fkey"
FOREIGN KEY ("organizationConfigId") REFERENCES "OrganizationConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOption"
ADD CONSTRAINT "ServiceOption_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtraOption"
ADD CONSTRAINT "ExtraOption_organizationConfigId_fkey"
FOREIGN KEY ("organizationConfigId") REFERENCES "OrganizationConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessRules"
ADD CONSTRAINT "BusinessRules_organizationConfigId_fkey"
FOREIGN KEY ("organizationConfigId") REFERENCES "OrganizationConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UIConfig"
ADD CONSTRAINT "UIConfig_organizationConfigId_fkey"
FOREIGN KEY ("organizationConfigId") REFERENCES "OrganizationConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
