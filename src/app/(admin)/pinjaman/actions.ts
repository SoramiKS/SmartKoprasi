'use server'

import { Prisma } from '@prisma/client'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { canDecideLoanApplication } from '@/lib/loan-workflow'
import { canRequestLoanCancellation } from '@/lib/loan-workflow'

const decisionSchema = z.object({
  loanId: z.string().min(1),
  decision: z.enum(['DISETUJUI', 'DITOLAK']),
  notes: z.string().trim().max(1000, 'Catatan maksimal 1.000 karakter.'),
})

type DecisionState = { error?: string } | null

export async function decideLoanApplication(_previousState: DecisionState, formData: FormData) {
  const actor = await requireAdmin()
  const result = decisionSchema.safeParse({
    loanId: formData.get('loanId'),
    decision: formData.get('decision'),
    notes: formData.get('notes') ?? '',
  })
  if (!result.success) return { error: 'Data keputusan tidak valid.' }

  const { loanId, decision, notes } = result.data

  try {
    const outcome = await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({ where: { id: loanId }, select: { id: true, status: true } })
      if (!loan) return 'missing'
      if (!canDecideLoanApplication(loan.status)) return 'already-decided'
      const pendingCancellation = await tx.loanCancellationRequest.findFirst({
        where: { loanId, status: 'MENUNGGU' },
        select: { id: true },
      })
      if (pendingCancellation) return 'cancellation-pending'

      const changed = await tx.loan.updateMany({
        where: { id: loanId, status: 'DIAJUKAN' },
        data: { status: decision },
      })
      if (changed.count !== 1) return 'already-decided'

      await tx.loanApprovalHistory.create({
        data: {
          loanId,
          status: decision,
          notes: notes || null,
          createdBy: actor.id,
        },
      })
      await tx.auditRecord.create({
        data: {
          userId: actor.id,
          action: decision === 'DISETUJUI' ? 'APPROVE_LOAN' : 'REJECT_LOAN',
          entity: 'Loan',
          entityId: loanId,
          details: JSON.stringify({ status: decision, notes: notes || null }),
        },
      })
      return 'updated'
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

    if (outcome === 'missing') return { error: 'Pengajuan pinjaman tidak ditemukan.' }
    if (outcome === 'already-decided') return { error: 'Pengajuan ini sudah diproses atau berubah. Muat ulang halaman.' }
    if (outcome === 'cancellation-pending') return { error: 'Ada permintaan pembatalan yang masih menunggu keputusan pengurus.' }
  } catch {
    return { error: 'Keputusan gagal disimpan. Silakan coba lagi.' }
  }

  redirect(`/pinjaman/${loanId}?status=${decision.toLowerCase()}`)
}

const cancellationReviewSchema = z.object({
  requestId: z.string().min(1),
  decision: z.enum(['DISETUJUI', 'DITOLAK']),
  notes: z.string().trim().max(1000, 'Catatan maksimal 1.000 karakter.'),
})

type CancellationReviewState = { error?: string } | null
type CancellationReviewOutcome =
  | { kind: 'missing' }
  | { kind: 'already-reviewed' }
  | { kind: 'loan-changed' }
  | { kind: 'approved' | 'rejected'; loanId: string }

export async function reviewLoanCancellationRequest(_previousState: CancellationReviewState, formData: FormData) {
  const actor = await requireAdmin()
  const result = cancellationReviewSchema.safeParse({
    requestId: formData.get('requestId'),
    decision: formData.get('decision'),
    notes: formData.get('notes') ?? '',
  })
  if (!result.success) return { error: 'Data keputusan pembatalan tidak valid.' }

  const { requestId, decision, notes } = result.data
  let outcome: CancellationReviewOutcome
  try {
    outcome = await prisma.$transaction(async (tx) => {
      const cancellation = await tx.loanCancellationRequest.findUnique({
        where: { id: requestId },
        include: { loan: { include: { installments: { select: { id: true } } } } },
      })
      if (!cancellation) return { kind: 'missing' as const }
      if (cancellation.status !== 'MENUNGGU') return { kind: 'already-reviewed' as const }

      if (decision === 'DISETUJUI') {
        const loan = cancellation.loan
        if (!canRequestLoanCancellation({
          status: loan.status,
          activatedAt: loan.activatedAt,
          policyId: loan.policyId,
          scheduleCount: loan.installments.length,
        })) return { kind: 'loan-changed' as const }

        const updatedLoan = await tx.loan.updateMany({
          where: {
            id: loan.id,
            status: { in: ['DIAJUKAN', 'DISETUJUI'] },
            activatedAt: null,
            policyId: null,
          },
          data: { status: 'DIBATALKAN' },
        })
        if (updatedLoan.count !== 1) return { kind: 'loan-changed' as const }
      }

      await tx.loanCancellationRequest.update({
        where: { id: cancellation.id },
        data: {
          status: decision,
          reviewedBy: actor.id,
          reviewedAt: new Date(),
          reviewNotes: notes || null,
        },
      })
      await tx.loanApprovalHistory.create({
        data: {
          loanId: cancellation.loanId,
          status: decision === 'DISETUJUI' ? 'DIBATALKAN' : cancellation.loan.status,
          notes: decision === 'DISETUJUI'
            ? `Permintaan pembatalan disetujui. Alasan anggota: ${cancellation.reason}${notes ? ` Catatan pengurus: ${notes}` : ''}`
            : `Permintaan pembatalan ditolak.${notes ? ` Catatan pengurus: ${notes}` : ''}`,
          createdBy: actor.id,
        },
      })
      await tx.auditRecord.create({
        data: {
          userId: actor.id,
          action: decision === 'DISETUJUI' ? 'APPROVE_LOAN_CANCELLATION' : 'REJECT_LOAN_CANCELLATION',
          entity: 'LoanCancellationRequest',
          entityId: cancellation.id,
          details: JSON.stringify({ loanId: cancellation.loanId, decision, notes: notes || null }),
        },
      })
      return { kind: decision === 'DISETUJUI' ? 'approved' as const : 'rejected' as const, loanId: cancellation.loanId }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

    if (outcome.kind === 'missing') return { error: 'Permintaan pembatalan tidak ditemukan.' }
    if (outcome.kind === 'already-reviewed') return { error: 'Permintaan ini sudah ditinjau pengurus.' }
    if (outcome.kind === 'loan-changed') return { error: 'Pinjaman sudah berubah atau aktif, sehingga pembatalan tidak dapat disetujui.' }
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      return { error: 'Data berubah bersamaan. Muat ulang halaman sebelum mencoba lagi.' }
    }
    return { error: 'Keputusan pembatalan gagal disimpan. Silakan coba lagi.' }
  }

  redirect(`/pinjaman/${outcome.loanId}?status=cancellation-${decision === 'DISETUJUI' ? 'approved' : 'rejected'}`)
}