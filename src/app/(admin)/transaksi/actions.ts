'use server'

import { Prisma } from '@prisma/client'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'

const transactionSchema = z.object({
  memberId: z.string().min(1, 'Pilih anggota.'),
  category: z.enum(['POKOK', 'WAJIB', 'SUKARELA']),
  type: z.enum(['DEPOSIT', 'WITHDRAWAL']),
  amount: z.string()
    .regex(/^\d{1,10}(\.\d{1,2})?$/, 'Masukkan nominal dengan maksimal sepuluh digit dan dua angka desimal.')
    .refine((value) => new Prisma.Decimal(value).greaterThan(0), 'Nominal harus lebih besar dari nol.'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal transaksi tidak valid.'),
  notes: z.string().trim().max(500, 'Catatan maksimal 500 karakter.'),
  idempotencyKey: z.string().uuid('Kunci transaksi tidak valid.'),
})

type TransactionFields = 'memberId' | 'category' | 'type' | 'amount' | 'date' | 'notes'
type TransactionState = {
  error?: string
  errors?: Partial<Record<TransactionFields, string[]>>
} | null

export async function createSavingsTransaction(_previousState: TransactionState, formData: FormData) {
  const actor = await requireAdmin()
  const result = transactionSchema.safeParse({
    memberId: formData.get('memberId'),
    category: formData.get('category'),
    type: formData.get('type'),
    amount: formData.get('amount'),
    date: formData.get('date'),
    notes: formData.get('notes') ?? '',
    idempotencyKey: formData.get('idempotencyKey'),
  })

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors }
  }

  const { memberId, category, type, amount, date, notes, idempotencyKey } = result.data
  const parsedDate = new Date(`${date}T00:00:00.000Z`)
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    return { errors: { date: ['Tanggal transaksi tidak valid.'] } }
  }

  const referenceNumber = `TRX-${idempotencyKey.toUpperCase()}`

  try {
    const missingMember = await prisma.$transaction(async (tx) => {
      const member = await tx.member.findUnique({ where: { id: memberId }, select: { id: true } })
      if (!member) return true

      const transaction = await tx.savingsTransaction.create({
        data: {
          memberId,
          category,
          type,
          amount: new Prisma.Decimal(amount),
          date: parsedDate,
          referenceNumber,
          notes: notes || null,
          createdBy: actor.id,
        },
      })

      await tx.auditRecord.create({
        data: {
          userId: actor.id,
          action: 'CREATE_SAVINGS_TRANSACTION',
          entity: 'SavingsTransaction',
          entityId: transaction.id,
          details: JSON.stringify({ category, type, amount, referenceNumber }),
        },
      })
      return false
    })

    if (missingMember) return { error: 'Anggota tidak ditemukan.' }
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { error: 'Transaksi ini sudah tercatat. Periksa daftar transaksi sebelum mencoba lagi.' }
    }
    return { error: 'Transaksi gagal disimpan. Silakan coba lagi.' }
  }

  redirect('/transaksi?status=created')
}