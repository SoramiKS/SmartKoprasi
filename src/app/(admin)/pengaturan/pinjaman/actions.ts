'use server'

import { Prisma } from '@prisma/client'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { MAX_POLICY_TERM_MONTHS } from '@/lib/loan-policy'

const policySchema = z.object({
  name: z.string().trim().min(3, 'Nama kebijakan minimal 3 karakter.').max(80),
  effectiveFrom: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal berlaku tidak valid.')
    .refine((value) => {
      const date = new Date(`${value}T00:00:00.000Z`)
      return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    }, 'Tanggal berlaku tidak valid.'),
  interestMethod: z.enum(['NONE', 'FLAT_ANNUAL']),
  annualRatePercent: z.string()
    .regex(/^\d{1,3}(\.\d{1,4})?$/, 'Gunakan angka dengan maksimal empat angka desimal.')
    .refine((value) => new Prisma.Decimal(value).lte('999.9999'), 'Tarif melebihi presisi yang didukung.'),
  maximumTermMonths: z.string()
    .regex(/^\d+$/, 'Tenor harus berupa bilangan bulat.')
    .transform(Number)
    .refine((value) => Number.isSafeInteger(value) && value >= 1 && value <= MAX_POLICY_TERM_MONTHS, `Tenor harus 1-${MAX_POLICY_TERM_MONTHS} bulan.`),
  firstDueDay: z.string()
    .regex(/^\d+$/, 'Tanggal jatuh tempo harus berupa bilangan bulat.')
    .transform(Number)
    .refine((value) => Number.isInteger(value) && value >= 1 && value <= 28, 'Tanggal jatuh tempo harus antara 1 dan 28.'),
}).superRefine((value, context) => {
  if (value.interestMethod === 'NONE' && new Prisma.Decimal(value.annualRatePercent).greaterThan(0)) {
    context.addIssue({ code: 'custom', path: ['annualRatePercent'], message: 'Metode tanpa bunga harus memakai tarif 0%.' })
  }
  if (value.interestMethod === 'FLAT_ANNUAL' && new Prisma.Decimal(value.annualRatePercent).lte(0)) {
    context.addIssue({ code: 'custom', path: ['annualRatePercent'], message: 'Masukkan tarif bunga tahunan lebih besar dari 0%.' })
  }
})

type PolicyFields = 'name' | 'effectiveFrom' | 'interestMethod' | 'annualRatePercent' | 'maximumTermMonths' | 'firstDueDay'
type PolicyFormState = {
  error?: string
  errors?: Partial<Record<PolicyFields, string[]>>
} | null

export async function createLoanPolicyVersion(_previousState: PolicyFormState, formData: FormData) {
  const actor = await requireAdmin()
  const result = policySchema.safeParse({
    name: formData.get('name'),
    effectiveFrom: formData.get('effectiveFrom'),
    interestMethod: formData.get('interestMethod'),
    annualRatePercent: formData.get('annualRatePercent'),
    maximumTermMonths: formData.get('maximumTermMonths'),
    firstDueDay: formData.get('firstDueDay'),
  })
  if (!result.success) return { errors: result.error.flatten().fieldErrors }

  const data = result.data
  const effectiveFrom = new Date(`${data.effectiveFrom}T00:00:00.000Z`)

  try {
    await prisma.$transaction(async (tx) => {
      const currentVersion = await tx.loanPolicy.aggregate({ _max: { version: true } })
      const version = (currentVersion._max.version ?? 0) + 1
      const policy = await tx.loanPolicy.create({
        data: {
          version,
          name: data.name,
          effectiveFrom,
          interestMethod: data.interestMethod,
          annualRatePercent: new Prisma.Decimal(data.annualRatePercent),
          maximumTermMonths: data.maximumTermMonths,
          firstDueDay: data.firstDueDay,
          createdBy: actor.id,
        },
      })
      await tx.auditRecord.create({
        data: {
          userId: actor.id,
          action: 'CREATE_LOAN_POLICY_VERSION',
          entity: 'LoanPolicy',
          entityId: policy.id,
          details: JSON.stringify({
            version,
            name: data.name,
            effectiveFrom: data.effectiveFrom,
            interestMethod: data.interestMethod,
            annualRatePercent: data.annualRatePercent,
            maximumTermMonths: data.maximumTermMonths,
            firstDueDay: data.firstDueDay,
          }),
        },
      })
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') return { error: 'Versi atau tanggal berlaku sudah digunakan.' }
      if (error.code === 'P2034') return { error: 'Pengaturan berubah bersamaan. Muat ulang dan coba kembali.' }
    }
    return { error: 'Kebijakan gagal disimpan. Silakan coba lagi.' }
  }

  redirect('/pengaturan/pinjaman?status=created')
}