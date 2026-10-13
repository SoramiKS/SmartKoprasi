'use server'

import { Prisma } from '@prisma/client'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getSession, requireMember } from '@/lib/session'
import { canRequestLoanCancellation } from '@/lib/loan-workflow'

const applicationSchema = z.object({
  amount: z.string()
    .regex(/^\d{1,10}(\.\d{1,2})?$/, 'Masukkan nominal dengan maksimal sepuluh digit dan dua angka desimal.')
    .refine((value) => new Prisma.Decimal(value).greaterThan(0), 'Nominal harus lebih besar dari nol.'),
  termMonths: z.string()
    .regex(/^\d+$/, 'Tenor harus berupa jumlah bulan bulat.')
    .transform(Number)
    .refine((value) => Number.isSafeInteger(value) && value > 0 && value <= 2147483647, 'Tenor harus lebih besar dari nol.'),
  notes: z.string().trim().max(1000, 'Keterangan maksimal 1.000 karakter.'),
  idempotencyKey: z.string().uuid('Kunci pengajuan tidak valid.'),
})

type ApplicationState = {
  error?: string
  errors?: Partial<Record<'amount' | 'termMonths' | 'notes', string[]>>
} | null

const cancellationSchema = z.object({
  loanId: z.string().min(1),
  reason: z.string().trim().min(10, 'Jelaskan alasan pembatalan minimal 10 karakter.').max(1000, 'Alasan maksimal 1.000 karakter.'),
})

type CancellationState = {
  error?: string
  errors?: { reason?: string[] }
} | null

export async function submitLoanApplication(_previousState: ApplicationState, formData: FormData) {
  const memberId = await requireMember()
  const session = await getSession()
  const actorId = session?.user?.id
  if (!actorId) return { error: 'Sesi berakhir. Silakan masuk kembali.' }

  const result = applicationSchema.safeParse({
    amount: formData.get('amount'),
    termMonths: formData.get('termMonths'),
    notes: formData.get('notes') ?? '',
    idempotencyKey: formData.get('idempotencyKey'),
  })
  if (!result.success) return { errors: result.error.flatten().fieldErrors }

  const { amount, termMonths, notes, idempotencyKey } = result.data
  const applicationDate = new Date()

  try {
    await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.create({
        data: {
          id: idempotencyKey,
          memberId,
          amount: new Prisma.Decimal(amount),
          termMonths,
          applicationDate,
          notes: notes || null,
          status: 'DIAJUKAN',
        },
      })

      await tx.loanApprovalHistory.create({
        data: {
          loanId: loan.id,
          status: 'DIAJUKAN',
          notes: 'Pengajuan dikirim oleh anggota.',
          createdBy: actorId,
        },
      })
      await tx.auditRecord.create({
        data: {
          userId: actorId,
          action: 'SUBMIT_LOAN_APPLICATION',
          entity: 'Loan',
          entityId: loan.id,
          details: JSON.stringify({ amount, termMonths }),
        },
      })
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { error: 'Pengajuan ini sudah tercatat.' }
    }
    return { error: 'Pengajuan pinjaman gagal disimpan. Silakan coba lagi.' }
  }

  redirect('/portal/pinjaman?status=created')
}

export async function requestLoanCancellation(_previousState: CancellationState, formData: FormData) {
  const memberId = await requireMember()
  const session = await getSession()
  const actorId = session?.user?.id
  if (!actorId) return { error: 'Sesi berakhir. Silakan masuk kembali.' }

  const result = cancellationSchema.safeParse({
    loanId: formData.get('loanId'),
    reason: formData.get('reason'),
  })
  if (!result.success) return { errors: result.error.flatten().fieldErrors }

  try {
    const outcome = await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findFirst({
        where: { id: result.data.loanId, memberId },
        include: { installments: { select: { id: true } } },
      })
      if (!loan) return 'missing'
      if (!canRequestLoanCancellation({
        status: loan.status,
        activatedAt: loan.activatedAt,
        policyId: loan.policyId,
        scheduleCount: loan.installments.length,
      })) return 'not-eligible'

      const pendingRequest = await tx.loanCancellationRequest.findFirst({
        where: { loanId: loan.id, status: 'MENUNGGU' },
        select: { id: true },
      })
      if (pendingRequest) return 'already-pending'

      const cancellation = await tx.loanCancellationRequest.create({
        data: {
          loanId: loan.id,
          requestedBy: actorId,
          reason: result.data.reason,
        },
      })
      await tx.auditRecord.create({
        data: {
          userId: actorId,
          action: 'REQUEST_LOAN_CANCELLATION',
          entity: 'LoanCancellationRequest',
          entityId: cancellation.id,
          details: JSON.stringify({ loanId: loan.id, reason: result.data.reason }),
        },
      })
      return 'requested'
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

    if (outcome === 'missing') return { error: 'Pinjaman tidak ditemukan.' }
    if (outcome === 'not-eligible') return { error: 'Pembatalan hanya dapat diajukan sebelum pinjaman diaktifkan dan jadwal dibuat.' }
    if (outcome === 'already-pending') return { error: 'Permintaan pembatalan pinjaman ini masih menunggu pengurus.' }
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      return { error: 'Status pinjaman berubah bersamaan. Muat ulang halaman dan coba kembali.' }
    }
    return { error: 'Permintaan pembatalan gagal dikirim. Silakan coba lagi.' }
  }

  redirect('/portal/pinjaman?status=cancellation-requested')
}