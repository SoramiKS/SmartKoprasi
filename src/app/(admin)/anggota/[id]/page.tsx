export const instant = false

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import prisma from '@/lib/prisma'

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      user: { select: { email: true } },
      _count: { select: { savings: true, loans: true } },
    },
  })

  if (!member) notFound()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/anggota" className="text-sm text-emerald-800 hover:underline">Kembali ke anggota</Link>
          <h2 className="mt-2 text-2xl font-bold text-slate-800">Detail Anggota</h2>
        </div>
        <Link href={`/anggota/${member.id}/edit`} className={buttonVariants({ variant: 'outline' })}>Ubah data</Link>
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
            <div><dt className="text-xs text-slate-500">Nomor identitas</dt><dd className="mt-1 font-medium">{member.identityNumber}</dd></div>
            <div><dt className="text-xs text-slate-500">Nomor telepon</dt><dd className="mt-1 font-medium">{member.phone}</dd></div>
            <div><dt className="text-xs text-slate-500">Email akun</dt><dd className="mt-1 font-medium">{member.user?.email ?? 'Belum terhubung'}</dd></div>
            <div><dt className="text-xs text-slate-500">Tanggal bergabung</dt><dd className="mt-1 font-medium">{member.joinedAt.toLocaleDateString('id-ID')}</dd></div>
            <div className="sm:col-span-2"><dt className="text-xs text-slate-500">Alamat</dt><dd className="mt-1 font-medium">{member.address}</dd></div>
          </dl>
        </CardContent>
      </Card>

      <section aria-label="Ringkasan catatan anggota" className="grid gap-4 sm:grid-cols-2">
        <Card><CardContent className="pt-5"><p className="text-sm text-slate-500">Transaksi simpanan</p><p className="mt-1 text-2xl font-semibold">{member._count.savings}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-sm text-slate-500">Pinjaman</p><p className="mt-1 text-2xl font-semibold">{member._count.loans}</p></CardContent></Card>
      </section>
    </div>
  )
}