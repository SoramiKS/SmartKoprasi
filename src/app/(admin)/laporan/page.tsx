export const instant = false

import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PrintButton from '@/components/reports/PrintButton'
import { getReportData, getReportMembers, parseReportFilters, reportTypes } from '@/lib/report-data'
import { formatRupiah } from '@/lib/utils'

const reportLabels = {
  anggota: 'Anggota',
  simpanan: 'Simpanan',
  pinjaman: 'Pinjaman',
  angsuran: 'Angsuran',
} as const

const statusOptions = {
  anggota: [{ value: 'ACTIVE', label: 'Aktif' }, { value: 'INACTIVE', label: 'Nonaktif' }],
  simpanan: [{ value: 'DEPOSIT', label: 'Setoran' }, { value: 'WITHDRAWAL', label: 'Penarikan' }],
  pinjaman: [
    { value: 'DIAJUKAN', label: 'Diajukan' }, { value: 'DISETUJUI', label: 'Disetujui' },
    { value: 'DITOLAK', label: 'Ditolak' }, { value: 'AKTIF', label: 'Aktif' }, { value: 'LUNAS', label: 'Lunas' },
    { value: 'DIBATALKAN', label: 'Dibatalkan' },
  ],
  angsuran: [
    { value: 'BELUM_DIBAYAR', label: 'Belum dibayar' }, { value: 'SEBAGIAN', label: 'Sebagian' },
    { value: 'LUNAS', label: 'Lunas' }, { value: 'TERLAMBAT', label: 'Terlambat' },
  ],
} as const

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function singleValue(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : undefined
}

function memberCategoryLabel(category: string) {
  if (category === 'POKOK') return 'Simpanan Pokok'
  if (category === 'WAJIB') return 'Simpanan Wajib'
  return 'Simpanan Sukarela'
}

function loanStatusLabel(status: string) {
  return statusOptions.pinjaman.find((option) => option.value === status)?.label ?? status
}

function installmentStatusLabel(status: string) {
  return statusOptions.angsuran.find((option) => option.value === status)?.label ?? status
}

export default async function LaporanPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const filters = parseReportFilters({
    type: singleValue(params.type),
    from: singleValue(params.from),
    to: singleValue(params.to),
    memberId: singleValue(params.memberId),
    status: singleValue(params.status),
    category: singleValue(params.category),
  })
  const [members, data] = await Promise.all([getReportMembers(), getReportData(filters)])
  const exportParams = new URLSearchParams({ type: filters.type, from: filters.from, to: filters.to })
  if (filters.memberId) exportParams.set('memberId', filters.memberId)
  if (filters.status) exportParams.set('status', filters.status)
  if (filters.category) exportParams.set('category', filters.category)
  const exportHref = `/api/laporan?${exportParams.toString()}`

  return (
    <div className="report-page space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Laporan</h2>
          <p className="mt-1 text-sm text-slate-500">Pratinjau dan ekspor laporan berdasarkan catatan database.</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Link href={exportHref} className={buttonVariants({ variant: 'outline' })}>Unduh CSV</Link>
          <PrintButton />
        </div>
      </div>

      <Card className="print:hidden">
        <CardContent className="pt-5">
          <form action="/laporan" method="get" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <label className="space-y-1 text-sm">
              <span className="font-medium">Jenis laporan</span>
              <select name="type" defaultValue={filters.type} className="h-10 w-full rounded-md border border-input bg-background px-3">
                {reportTypes.map((type) => <option key={type} value={type}>{reportLabels[type]}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Dari tanggal</span>
              <input name="from" type="date" defaultValue={filters.from} required className="h-10 w-full rounded-md border border-input bg-background px-3" />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Sampai tanggal</span>
              <input name="to" type="date" defaultValue={filters.to} required className="h-10 w-full rounded-md border border-input bg-background px-3" />
            </label>
            {filters.type !== 'anggota' && (
              <label className="space-y-1 text-sm xl:col-span-2">
                <span className="font-medium">Anggota</span>
                <select name="memberId" defaultValue={filters.memberId ?? ''} className="h-10 w-full rounded-md border border-input bg-background px-3">
                  <option value="">Semua anggota</option>
                  {members.map((member) => <option key={member.id} value={member.id}>{member.memberNumber} · {member.fullName}</option>)}
                </select>
              </label>
            )}
            {filters.type === 'simpanan' && (
              <label className="space-y-1 text-sm">
                <span className="font-medium">Kategori</span>
                <select name="category" defaultValue={filters.category ?? ''} className="h-10 w-full rounded-md border border-input bg-background px-3">
                  <option value="">Semua kategori</option>
                  <option value="POKOK">Simpanan Pokok</option>
                  <option value="WAJIB">Simpanan Wajib</option>
                  <option value="SUKARELA">Simpanan Sukarela</option>
                </select>
              </label>
            )}
            {filters.type !== 'anggota' && (
              <label className="space-y-1 text-sm">
                <span className="font-medium">{filters.type === 'simpanan' ? 'Jenis transaksi' : 'Status'}</span>
                <select name="status" defaultValue={filters.status ?? ''} className="h-10 w-full rounded-md border border-input bg-background px-3">
                  <option value="">Semua</option>
                  {statusOptions[filters.type].map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            )}
            {filters.type === 'anggota' && (
              <label className="space-y-1 text-sm">
                <span className="font-medium">Status</span>
                <select name="status" defaultValue={filters.status ?? ''} className="h-10 w-full rounded-md border border-input bg-background px-3">
                  <option value="">Semua</option>
                  {statusOptions.anggota.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            )}
            <div className="flex items-end gap-2 sm:col-span-2 xl:col-span-6">
              <Button type="submit" className="bg-emerald-700 text-white hover:bg-emerald-800">Tampilkan pratinjau</Button>
              <Link href="/laporan" className="inline-flex h-10 items-center px-3 text-sm text-slate-600 hover:text-emerald-800">Reset</Link>
            </div>
          </form>
          {filters.invalidRange && <p role="alert" className="mt-3 text-sm text-amber-800">Rentang tanggal tidak valid; menampilkan bulan berjalan.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div><CardTitle>Pratinjau · {reportLabels[data.type]}</CardTitle><p className="mt-1 text-sm text-slate-500">Periode {new Date(`${filters.from}T00:00:00.000Z`).toLocaleDateString('id-ID')} – {new Date(`${filters.to}T00:00:00.000Z`).toLocaleDateString('id-ID')}</p></div>
          <span className="text-sm text-slate-500">{data.rows.length} baris</span>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            {data.type === 'anggota' && (
              <table className="w-full min-w-190 text-left text-sm">
                <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3 font-medium">No. Anggota</th><th className="px-4 py-3 font-medium">Nama</th><th className="px-4 py-3 font-medium">Telepon</th><th className="px-4 py-3 font-medium">Email</th><th className="px-4 py-3 font-medium">Bergabung</th><th className="px-4 py-3 font-medium">Status</th></tr></thead>
                <tbody>{data.rows.map((member) => <tr key={member.id} className="border-b last:border-0"><td className="px-4 py-3">{member.memberNumber}</td><td className="px-4 py-3">{member.fullName}</td><td className="px-4 py-3">{member.phone}</td><td className="px-4 py-3">{member.user?.email ?? '-'}</td><td className="whitespace-nowrap px-4 py-3">{member.joinedAt.toLocaleDateString('id-ID')}</td><td className="px-4 py-3">{member.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}</td></tr>)}</tbody>
              </table>
            )}
            {data.type === 'simpanan' && (
              <table className="w-full min-w-205 text-left text-sm">
                <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3 font-medium">Tanggal</th><th className="px-4 py-3 font-medium">Anggota</th><th className="px-4 py-3 font-medium">Kategori</th><th className="px-4 py-3 font-medium">Jenis</th><th className="px-4 py-3 text-right font-medium">Nominal</th><th className="px-4 py-3 font-medium">Referensi</th></tr></thead>
                <tbody>{data.rows.map((row) => <tr key={row.id} className="border-b last:border-0"><td className="whitespace-nowrap px-4 py-3">{row.date.toLocaleDateString('id-ID')}</td><td className="px-4 py-3">{row.member.fullName}<span className="block text-xs text-slate-500">{row.member.memberNumber}</span></td><td className="px-4 py-3">{memberCategoryLabel(row.category)}</td><td className="px-4 py-3">{row.type === 'DEPOSIT' ? 'Setoran' : 'Penarikan'}</td><td className="whitespace-nowrap px-4 py-3 text-right">{formatRupiah(row.amount)}</td><td className="px-4 py-3 font-mono text-xs">{row.referenceNumber}</td></tr>)}</tbody>
              </table>
            )}
            {data.type === 'pinjaman' && (
              <table className="w-full min-w-200 text-left text-sm">
                <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3 font-medium">Tanggal pengajuan</th><th className="px-4 py-3 font-medium">Anggota</th><th className="px-4 py-3 text-right font-medium">Jumlah</th><th className="px-4 py-3 font-medium">Tenor</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Aktif sejak</th></tr></thead>
                <tbody>{data.rows.map((row) => <tr key={row.id} className="border-b last:border-0"><td className="whitespace-nowrap px-4 py-3">{row.applicationDate.toLocaleDateString('id-ID')}</td><td className="px-4 py-3">{row.member.fullName}<span className="block text-xs text-slate-500">{row.member.memberNumber}</span></td><td className="whitespace-nowrap px-4 py-3 text-right">{formatRupiah(row.amount)}</td><td className="px-4 py-3">{row.termMonths} bulan</td><td className="px-4 py-3">{loanStatusLabel(row.status)}</td><td className="whitespace-nowrap px-4 py-3">{row.activatedAt?.toLocaleDateString('id-ID') ?? '-'}</td></tr>)}</tbody>
              </table>
            )}
            {data.type === 'angsuran' && (
              <table className="w-full min-w-195 text-left text-sm">
                <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3 font-medium">Jatuh tempo</th><th className="px-4 py-3 font-medium">Anggota</th><th className="px-4 py-3 text-right font-medium">Tagihan</th><th className="px-4 py-3 text-right font-medium">Terbayar</th><th className="px-4 py-3 text-right font-medium">Sisa</th><th className="px-4 py-3 font-medium">Status</th></tr></thead>
                <tbody>{data.rows.map((row) => <tr key={row.id} className="border-b last:border-0"><td className="whitespace-nowrap px-4 py-3">{row.dueDate.toLocaleDateString('id-ID')}</td><td className="px-4 py-3">{row.loan.member.fullName}<span className="block text-xs text-slate-500">{row.loan.member.memberNumber}</span></td><td className="whitespace-nowrap px-4 py-3 text-right">{formatRupiah(row.amountDue)}</td><td className="whitespace-nowrap px-4 py-3 text-right">{formatRupiah(row.amountPaid)}</td><td className="whitespace-nowrap px-4 py-3 text-right">{formatRupiah(row.amountDue.minus(row.amountPaid))}</td><td className="px-4 py-3">{installmentStatusLabel(row.status)}</td></tr>)}</tbody>
              </table>
            )}
            {data.rows.length === 0 && <p className="px-4 py-10 text-center text-sm text-slate-500">Tidak ada data yang cocok dengan filter ini.</p>}
          </div>
          <p className="mt-3 text-xs text-slate-500">CSV berisi seluruh baris sesuai filter yang sama dengan pratinjau ini.</p>
        </CardContent>
      </Card>
    </div>
  )
}