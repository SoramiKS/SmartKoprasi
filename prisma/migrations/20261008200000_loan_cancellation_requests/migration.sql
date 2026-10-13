-- AlterEnum
ALTER TYPE "LoanStatus" ADD VALUE 'DIBATALKAN';

-- CreateEnum
CREATE TYPE "LoanCancellationStatus" AS ENUM ('MENUNGGU', 'DISETUJUI', 'DITOLAK');

-- CreateTable
CREATE TABLE "LoanCancellationRequest" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "LoanCancellationStatus" NOT NULL DEFAULT 'MENUNGGU',
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    CONSTRAINT "LoanCancellationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoanCancellationRequest_loanId_status_idx" ON "LoanCancellationRequest"("loanId", "status");

-- CreateIndex
CREATE INDEX "LoanCancellationRequest_status_createdAt_idx" ON "LoanCancellationRequest"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "LoanCancellationRequest" ADD CONSTRAINT "LoanCancellationRequest_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanCancellationRequest" ADD CONSTRAINT "LoanCancellationRequest_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanCancellationRequest" ADD CONSTRAINT "LoanCancellationRequest_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
