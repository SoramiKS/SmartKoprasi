'use server'

import { Prisma } from '@prisma/client'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { buildRepaymentPlan } from '@/lib/loan-policy'

const activationSchema = z.object({ loanId: z.string().min(1) })
type ActivationState = { error?: string } | null

export async function activateApprovedLoan(_previousState: ActivationState, formData: FormData) {
  const actor = await requireAdmin()
  const result = activationSchema.safeParse({ loanId: formData.get('loanId') })
  if (!result.success) return { error: 'Pinjaman tidak valid.' }

  const { loanId } = result.data
  try {
    const outcome = await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({
        where: { id: loanId },
        include: { installments: { select: { id: true } } },
      })
      if (!loan) return { kind: 'missing' as const }
      if (loan.status !== 'DISETUJUI') return { kind: 'not-approved' as const }
      if (loan.installments.length > 0 || loan.policyId) return { kind: 'already-active' as const }
      const pendingCancellation = await tx.loanCancellationRequest.findFirst({
        where: { loanId, status: 'MENUNGGU' },
        select: { id: true },
      })
      if (pendingCancellation) return { kind: 'cancellation-pending' as const }

      const activatedAt = new Date()
      const policy = await tx.loanPolicy.findFirst({
        where: { effectiveFrom: { lte: activatedAt } },
        orderBy: [{ effectiveFrom: 'desc' }, { version: 'desc' }],
      })
      if (!policy) return { kind: 'no-policy' as const }
      if (loan.termMonths > policy.maximumTermMonths) return { kind: 'term-exceeds-policy' as const }

      const plan = buildRepaymentPlan({
        principal: loan.amount,
        termMonths: loan.termMonths,
        interestMethod: policy.interestMethod,
        annualRatePercent: policy.annualRatePercent,
        activatedAt,
        firstDueDay: policy.firstDueDay,
      })

      const updated = await tx.loan.updateMany({
        where: { id: loanId, status: 'DISETUJUI', policyId: null },
        data: {
          status: 'AKTIF',
          policyId: policy.id,
          appliedPolicyVersion: policy.version,
          appliedInterestMethod: policy.interestMethod,
          appliedAnnualRatePercent: policy.annualRatePercent,
          totalRepaymentAmount: plan.totalRepayment,
          activatedAt,
        },
      })
      if (updated.count !== 1) return { kind: 'changed' as const }

      await tx.installmentSchedule.createMany({
        data: plan.installments.map((installment) => ({
          loanId,
          dueDate: installment.dueDate,
          amountDue: installment.amountDue,
          amountPaid: new Prisma.Decimal(0),
          status: 'BELUM_DIBAYAR' as const,
        })),
      })
      const activationNote = `Diaktifkan memakai kebijakan v${policy.version} (${policy.name}); bunga ${policy.interestMethod === 'NONE' ? '0%' : `${policy.annualRatePercent.toString()}% flat per tahun`}.`
      await tx.loanApprovalHistory.create({
        data: { loanId, status: 'AKTIF', notes: activationNote, createdBy: actor.id },
      })
      await tx.auditRecord.create({
        data: {
          userId: actor.id,
          action: 'ACTIVATE_LOAN_AND_CREATE_SCHEDULE',
          entity: 'Loan',
          entityId: loanId,
          details: JSON.stringify({
            policyId: policy.id,
            policyVersion: policy.version,
            totalRepayment: plan.totalRepayment.toString(),
            interestAmount: plan.interestAmount.toString(),
            installmentCount: plan.installments.length,
          }),
        },
      })
      return { kind: 'activated' as const }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

    if (outcome.kind === 'missing') return { error: 'Pinjaman tidak ditemukan.' }
    if (outcome.kind === 'not-approved') return { error: 'Hanya pinjaman yang disetujui dapat diaktifkan.' }
    if (outcome.kind === 'already-active') return { error: 'Pinjaman ini sudah memiliki jadwal atau kebijakan aktivasi.' }
    if (outcome.kind === 'cancellation-pending') return { error: 'Permintaan pembatalan pinjaman sedang ditinjau pengurus.' }
    if (outcome.kind === 'no-policy') return { error: 'Belum ada kebijakan yang berlaku. Terbitkan kebijakan di menu Pengaturan Pinjaman.' }
    if (outcome.kind === 'term-exceeds-policy') return { error: 'Tenor pengajuan melebihi tenor maksimum pada kebijakan yang berlaku.' }
    if (outcome.kind === 'changed') return { error: 'Pinjaman berubah bersamaan. Muat ulang halaman sebelum mencoba lagi.' }
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      return { error: 'Data berubah bersamaan. Muat ulang halaman sebelum mencoba lagi.' }
    }
    if (error instanceof RangeError) return { error: error.message }
    return { error: 'Aktivasi pinjaman gagal. Tidak ada jadwal yang disimpan.' }
  }

  redirect(`/pinjaman/${loanId}?status=activated`)
}