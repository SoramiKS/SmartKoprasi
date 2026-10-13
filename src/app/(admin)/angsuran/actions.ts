'use server'

import { Prisma } from '@prisma/client'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { calculateInstallmentPayment } from '@/lib/financial'

const paymentSchema = z.object({
  scheduleId: z.string().min(1, 'Jadwal angsuran tidak valid.'),
  amount: z.string()
    .regex(/^\d{1,10}(\.\d{1,2})?$/, 'Masukkan nominal dengan maksimal dua angka desimal.')
    .refine((value) => new Prisma.Decimal(value).greaterThan(0), 'Nominal harus lebih besar dari nol.'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal pembayaran tidak valid.'),
  notes: z.string().trim().max(500, 'Catatan maksimal 500 karakter.'),
  idempotencyKey: z.string().uuid('Kunci pembayaran tidak valid.'),
})

type PaymentFields = 'scheduleId' | 'amount' | 'date' | 'notes'
type PaymentState = {
  error?: string
  errors?: Partial<Record<PaymentFields, string[]>>
} | null

export async function recordInstallmentPayment(_previousState: PaymentState, formData: FormData) {
  const actor = await requireAdmin()
  const result = paymentSchema.safeParse({
    scheduleId: formData.get('scheduleId'),
    amount: formData.get('amount'),
    date: formData.get('date'),
    notes: formData.get('notes') ?? '',
    idempotencyKey: formData.get('idempotencyKey'),
  })

  if (!result.success) return { errors: result.error.flatten().fieldErrors }

  const { scheduleId, amount, date, notes, idempotencyKey } = result.data
  const paymentDate = new Date(`${date}T00:00:00.000Z`)
  if (Number.isNaN(paymentDate.getTime()) || paymentDate.toISOString().slice(0, 10) !== date) {
    return { errors: { date: ['Tanggal pembayaran tidak valid.'] } }
  }

  const referenceNumber = `PAY-${idempotencyKey.toUpperCase()}`

  try {
    const outcome = await prisma.$transaction(async (tx) => {
      const schedule = await tx.installmentSchedule.findUnique({
        where: { id: scheduleId },
        include: { loan: { select: { id: true, status: true } } },
      })

      if (!schedule) return { error: 'Jadwal angsuran tidak ditemukan.' }
      if (schedule.loan.status !== 'AKTIF') return { error: 'Pembayaran hanya dapat dicatat untuk pinjaman aktif.' }

      const calculation = calculateInstallmentPayment(schedule.amountDue, schedule.amountPaid, amount)
      if (!calculation) return { error: 'Nominal pembayaran melebihi sisa angsuran atau tidak valid.' }

      const today = new Date().toISOString().slice(0, 10)
      const isOverdue = schedule.dueDate.toISOString().slice(0, 10) < today
      const nextStatus = calculation.remaining.isZero()
        ? 'LUNAS'
        : isOverdue ? 'TERLAMBAT' : 'SEBAGIAN'

      const updated = await tx.installmentSchedule.updateMany({
        where: { id: schedule.id, amountPaid: schedule.amountPaid, status: { not: 'LUNAS' } },
        data: { amountPaid: calculation.amountPaid, status: nextStatus },
      })
      if (updated.count !== 1) return { error: 'Jadwal baru saja berubah. Muat ulang sebelum mencatat pembayaran.' }

      const payment = await tx.installmentPayment.create({
        data: {
          installmentScheduleId: schedule.id,
          amount: new Prisma.Decimal(amount),
          date: paymentDate,
          referenceNumber,
          notes: notes || null,
          createdBy: actor.id,
        },
      })

      await tx.auditRecord.create({
        data: {
          userId: actor.id,
          action: 'RECORD_INSTALLMENT_PAYMENT',
          entity: 'InstallmentPayment',
          entityId: payment.id,
          details: JSON.stringify({ scheduleId, amount, referenceNumber, status: nextStatus }),
        },
      })

      if (nextStatus === 'LUNAS') {
        const unpaidSchedules = await tx.installmentSchedule.count({
          where: { loanId: schedule.loan.id, status: { not: 'LUNAS' } },
        })

        if (unpaidSchedules === 0) {
          await tx.loan.update({ where: { id: schedule.loan.id }, data: { status: 'LUNAS' } })
          await tx.loanApprovalHistory.create({
            data: {
              loanId: schedule.loan.id,
              status: 'LUNAS',
              notes: 'Seluruh angsuran telah lunas.',
              createdBy: actor.id,
            },
          })
          await tx.auditRecord.create({
            data: {
              userId: actor.id,
              action: 'CLOSE_PAID_LOAN',
              entity: 'Loan',
              entityId: schedule.loan.id,
              details: JSON.stringify({ status: 'LUNAS' }),
            },
          })
        }
      }

      return { error: undefined }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

    if (outcome.error) return { error: outcome.error }
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') return { error: 'Pembayaran ini sudah tercatat.' }
      if (error.code === 'P2034') return { error: 'Data berubah bersamaan. Muat ulang dan coba kembali.' }
    }
    return { error: 'Pembayaran gagal disimpan. Silakan coba lagi.' }
  }

  redirect('/angsuran?status=created')
}