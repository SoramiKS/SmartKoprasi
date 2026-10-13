import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function getSession() {
  return getServerSession(authOptions)
}

export async function requireAdmin() {
  const session = await getSession()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  if (user?.role !== 'ADMIN') redirect('/portal')
  return session.user
}

export async function requireMember() {
  const session = await getSession()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, member: { select: { id: true } } },
  })

  if (user?.role !== 'MEMBER' || !user.member) redirect('/dashboard')
  return user.member.id
}
