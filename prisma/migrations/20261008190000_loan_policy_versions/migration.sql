-- CreateEnum
CREATE TYPE "LoanInterestMethod" AS ENUM ('NONE', 'FLAT_ANNUAL');

-- CreateTable
CREATE TABLE "LoanPolicy" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "interestMethod" "LoanInterestMethod" NOT NULL,
    "annualRatePercent" DECIMAL(7,4) NOT NULL,
    "maximumTermMonths" INTEGER NOT NULL,
    "firstDueDay" INTEGER NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LoanPolicy_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Loan"
    ADD COLUMN "policyId" TEXT,
    ADD COLUMN "appliedPolicyVersion" INTEGER,
    ADD COLUMN "appliedInterestMethod" "LoanInterestMethod",
    ADD COLUMN "appliedAnnualRatePercent" DECIMAL(7,4),
    ADD COLUMN "totalRepaymentAmount" DECIMAL(14,2),
    ADD COLUMN "activatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "LoanPolicy_version_key" ON "LoanPolicy"("version");

-- CreateIndex
CREATE UNIQUE INDEX "LoanPolicy_effectiveFrom_key" ON "LoanPolicy"("effectiveFrom");

-- CreateIndex
CREATE INDEX "LoanPolicy_effectiveFrom_idx" ON "LoanPolicy"("effectiveFrom");

-- AddForeignKey
ALTER TABLE "LoanPolicy" ADD CONSTRAINT "LoanPolicy_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "LoanPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
