-- AlterTable
ALTER TABLE "ServiceOrder" ADD COLUMN     "assignedToUserId" TEXT;

-- CreateIndex
CREATE INDEX "ServiceOrder_assignedToUserId_idx" ON "ServiceOrder"("assignedToUserId");

-- AddForeignKey
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
