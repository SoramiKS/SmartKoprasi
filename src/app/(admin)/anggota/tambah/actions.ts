'use server'

import { z } from 'zod'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/session'
import { hash } from 'bcryptjs'
import { Prisma } from '@prisma/client'

type MemberFormState = {
  error?: string
  errors?: Partial<Record<'memberNumber' | 'fullName' | 'identityNumber' | 'phone' | 'address' | 'joinedAt' | 'status' | 'email' | 'password', string[]>>
} | null

const anggotaSchema = z.object({
  memberNumber: z.string().trim().min(2, { message: 'Nomor anggota wajib diisi' }).max(40),
  fullName: z.string().trim().min(3, { message: 'Nama lengkap minimal 3 karakter' }),
  identityNumber: z.string().regex(/^\d{16}$/, { message: 'Nomor KTP harus terdiri dari 16 digit' }),
  phone: z.string().trim().min(8, { message: 'Nomor telepon tidak valid' }).max(20),
  address: z.string().trim().min(5, { message: 'Alamat wajib diisi' }),
  joinedAt: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Tanggal bergabung tidak valid' })
    .refine((value) => {
      const date = new Date(`${value}T00:00:00.000Z`)
      return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    }, { message: 'Tanggal bergabung tidak valid' }),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  email: z.string().trim().email({ message: 'Email tidak valid' }).transform((email) => email.toLowerCase()),
  password: z.string().min(6, { message: 'Password minimal 6 karakter' }),
})

export async function createAnggota(_prevState: MemberFormState, formData: FormData) {
  const actor = await requireAdmin()

  const result = anggotaSchema.safeParse(Object.fromEntries(formData))

  if (!result.success) {
    return {
      error: 'Data tidak valid',
      errors: result.error.flatten().fieldErrors
    }
  }

  const { memberNumber, fullName, identityNumber, phone, address, joinedAt, status, email, password } = result.data
  const membershipDate = new Date(`${joinedAt}T00:00:00.000Z`)
  const passwordHash = await hash(password, 12)

  try {
    await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: passwordHash,
          role: 'MEMBER'
        }
      })

      await tx.member.create({
        data: {
          userId: user.id,
          memberNumber,
          fullName,
          identityNumber,
          phone,
          address,
          joinedAt: membershipDate,
          status,
        }
      })

      // Audit log
      await tx.auditRecord.create({
        data: {
          userId: actor.id,
          action: 'CREATE_MEMBER',
          entity: 'Member',
          entityId: memberNumber,
          details: JSON.stringify({ fullName, memberNumber, status })
        }
      })
    })
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { error: 'Email atau Nomor KTP sudah terdaftar' }
    }
    return { error: 'Terjadi kesalahan sistem' }
  }

  redirect('/anggota')
}
