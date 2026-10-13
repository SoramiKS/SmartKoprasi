export const instant = false

import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import prisma from '@/lib/prisma'
import { requireMember } from '@/lib/session'

export default async function MemberProfilePage() {
  const memberId = await requireMember()
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: { user: { select: { email: true } } },
  })

  if (!member) notFound()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Profil Saya</h2>
        <p className="mt-1 text-sm text-slate-500">Informasi keanggotaan yang terdaftar di koperasi.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>{member.fullName}</CardTitle>
            <p className="mt-1 text-sm text-slate-500">{member.memberNumber}</p>
          </div>
          <span className={`rounded-sm px-2 py-1 text-xs font-medium ${member.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
            {member.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
          </span>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500">Nomor anggota</dt>
              <dd className="mt-1 font-medium">{member.memberNumber}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Email akun</dt>
              <dd className="mt-1 break-words font-medium">{member.user?.email ?? 'Belum terhubung'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Nomor identitas</dt>
              <dd className="mt-1 font-medium">{member.identityNumber}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Nomor telepon</dt>
              <dd className="mt-1 font-medium">{member.phone}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Tanggal bergabung</dt>
              <dd className="mt-1 font-medium">{member.joinedAt.toLocaleDateString('id-ID')}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-slate-500">Alamat</dt>
              <dd className="mt-1 font-medium">{member.address}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
