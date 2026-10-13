'use server'

import { Prisma } from '@prisma/client'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'

const memberEditSchema = z.object({
  memberId: z.string().min(1),
  memberNumber: z.string().trim().min(2, 'Nomor anggota wajib diisi.').max(40),
  fullName: z.string().trim().min(3, 'Nama lengkap minimal 3 karakter.'),
  identityNumber: z.string().regex(/^\d{16}$/, 'Nomor KTP harus terdiri dari 16 digit.'),
  phone: z.string().trim().min(8, 'Nomor telepon tidak valid.').max(20),
  address: z.string().trim().min(5, 'Alamat wajib diisi.'),
  joinedAt: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal bergabung tidak valid.')
    .refine((value) => {
      const date = new Date(`${value}T00:00:00.000Z`)
      return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    }, 'Tanggal bergabung tidak valid.'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
})

type MemberEditFields = 'memberNumber' | 'fullName' | 'identityNumber' | 'phone' | 'address' | 'joinedAt' | 'status'
type MemberEditState = {
  error?: string
  errors?: Partial<Record<MemberEditFields, string[]>>
} | null

export async function updateAnggota(_previousState: MemberEditState, formData: FormData) {
  const actor = await requireAdmin()
  const result = memberEditSchema.safeParse({
    memberId: formData.get('memberId'),
    memberNumber: formData.get('memberNumber'),
    fullName: formData.get('fullName'),
    identityNumber: formData.get('identityNumber'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    joinedAt: formData.get('joinedAt'),
    status: formData.get('status'),
  })

  if (!result.success) return { errors: result.error.flatten().fieldErrors }

  const { memberId, ...memberData } = result.data
  const updated = await prisma.$transaction(async (tx) => {
    const existing = await tx.member.findUnique({ where: { id: memberId }, select: { id: true } })
    if (!existing) return false

    await tx.member.update({
      where: { id: memberId },
      data: { ...memberData, joinedAt: new Date(`${memberData.joinedAt}T00:00:00.000Z`) },
    })
    await tx.auditRecord.create({
      data: {
        userId: actor.id,
        action: 'UPDATE_MEMBER',
        entity: 'Member',
        entityId: memberId,
        details: JSON.stringify({ memberNumber: memberData.memberNumber, status: memberData.status }),
      },
    })
    return true
  }).catch((error: unknown) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return 'duplicate'
    }
    return 'failure'
  })

  if (updated === 'duplicate') return { error: 'Nomor anggota atau nomor KTP sudah digunakan.' }
  if (updated === 'failure') return { error: 'Perubahan anggota gagal disimpan. Silakan coba lagi.' }
  if (!updated) return { error: 'Anggota tidak ditemukan.' }

  redirect(`/anggota/${memberId}`)
}