export const instant = false

import Link from 'next/link'
import { Prisma } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import prisma from '@/lib/prisma'
import { formatRupiah } from '@/lib/utils'

const pageSize = 20
const loanStatuses = ['DIAJUKAN', 'DISETUJUI', 'DITOLAK', 'AKTIF', 'LUNAS', 'DIBATALKAN'] as const
const statusLabels: Record<string, string> = {
  DIAJUKAN: 'Diajukan',
  DISETUJUI: 'Disetujui',
  DITOLAK: 'Ditolak',
  AKTIF: 'Aktif',
  LUNAS: 'Lunas',
  DIBATALKAN: 'Dibatalkan',
}

export default async function PinjamanPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}) {
  const params = await searchParams
  const search = params.q?.trim() ?? ''
  const status = loanStatuses.find((value) => value === params.status)
  const requestedPage = Number(params.page ?? '1')
  const safePage = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const where: Prisma.LoanWhereInput = {}

  if (status) where.status = status
  if (search) {
    where.member = {
      OR: [
        { memberNumber: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ],
    }
  }

  const totalLoans = await prisma.loan.count({ where })
  const pageCount = Math.max(1, Math.ceil(totalLoans / pageSize))
  const currentPage = Math.min(safePage, pageCount)
  const loans = await prisma.loan.findMany({
    where,
    include: {
      member: { select: { memberNumber: true, fullName: true } },
      installments: { select: { id: true } },
      cancellationRequests: { where: { status: 'MENUNGGU' }, select: { id: true } },
    },
    orderBy: [{ applicationDate: 'desc' }, { createdAt: 'desc' }],
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  })
  const paginationParams = new URLSearchParams()
  if (search) paginationParams.set('q', search)
  if (status) paginationParams.set('status', status)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Manajemen Pinjaman</h2>
        <p className="mt-1 text-sm text-slate-500">Tinjau pengajuan dan lihat riwayat keputusan pinjaman.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Pengajuan dan pinjaman</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form action="/pinjaman" method="get" className="flex flex-wrap items-end gap-3">
            <label className="min-w-52 flex-1 space-y-1 text-sm">
              <span className="font-medium">Cari anggota</span>
              <input name="q" defaultValue={search} placeholder="Nomor atau nama anggota" className="h-10 w-full rounded-md border border-input bg-background px-3" />
            </label>
            <label className="min-w-44 space-y-1 text-sm">
              <span className="font-medium">Status</span>
              <select name="status" defaultValue={status ?? ''} className="h-10 w-full rounded-md border border-input bg-background px-3">
                <option value="">Semua status</option>
                {loanStatuses.map((loanStatus) => <option key={loanStatus} value={loanStatus}>{statusLabels[loanStatus]}</option>)}
              </select>
            </label>
            <Button type="submit" variant="outline">Terapkan</Button>
            <Link href="/pinjaman" className="inline-flex h-10 items-center px-2 text-sm text-slate-600 hover:text-emerald-800">Reset</Link>
          </form>

          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Anggota</th>
                  <th className="px-4 py-3 font-medium">Tanggal pengajuan</th>
                  <th className="px-4 py-3 font-medium text-right">Jumlah</th>
                  <th className="px-4 py-3 font-medium">Tenor</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Jadwal</th>
                  <th className="px-4 py-3 font-medium">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <tr key={loan.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{loan.member.fullName}</p>
                      <p className="text-xs text-slate-500">{loan.member.memberNumber}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{loan.applicationDate.toLocaleDateString('id-ID')}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium">{formatRupiah(loan.amount)}</td>
                    <td className="px-4 py-3">{loan.termMonths} bulan</td>
                    <td className="px-4 py-3"><span className="rounded-sm bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{statusLabels[loan.status]}</span>{loan.cancellationRequests.length > 0 && <span className="mt-1 block text-xs font-medium text-amber-800">Pembatalan menunggu</span>}</td>
                    <td className="px-4 py-3">{loan.installments.length === 0 ? 'Belum dibuat' : `${loan.installments.length} angsuran`}</td>
                    <td className="px-4 py-3"><Link href={`/pinjaman/${loan.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>Tinjau</Link></td>
                  </tr>
                ))}
                {loans.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">Tidak ada pinjaman yang sesuai.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
            <span>{totalLoans} pengajuan · Halaman {currentPage} dari {pageCount}</span>
            <div className="flex gap-2">
              {currentPage > 1 ? (
                <Link href={`/pinjaman?${paginationParams.toString()}${paginationParams.size ? '&' : ''}page=${currentPage - 1}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>Sebelumnya</Link>
              ) : <Button variant="outline" size="sm" disabled>Sebelumnya</Button>}
              {currentPage < pageCount ? (
                <Link href={`/pinjaman?${paginationParams.toString()}${paginationParams.size ? '&' : ''}page=${currentPage + 1}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>Berikutnya</Link>
              ) : <Button variant="outline" size="sm" disabled>Berikutnya</Button>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}