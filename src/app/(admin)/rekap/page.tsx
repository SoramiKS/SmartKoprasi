export const instant = false

import { connection } from 'next/server'
import { Banknote, CalendarRange, CreditCard, ReceiptText, Wallet } from 'lucide-react'
import { Prisma } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import prisma from '@/lib/prisma'
import { formatRupiah } from '@/lib/utils'

type SearchParams = Promise<{ from?: string | string[]; to?: string | string[] }>

function singleValue(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : undefined
}

function parseDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null
  return date
}

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10)
}

function displayCategory(category: string) {
  if (category === 'POKOK') return 'Simpanan Pokok'
  if (category === 'WAJIB') return 'Simpanan Wajib'
  return 'Simpanan Sukarela'
}

export default async function RekapPage({ searchParams }: { searchParams: SearchParams }) {
  await connection()
  const params = await searchParams
  const now = new Date()
  const defaultFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const defaultTo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const requestedFrom = singleValue(params.from)
  const requestedTo = singleValue(params.to)
  const parsedFrom = parseDate(requestedFrom)
  const parsedTo = parseDate(requestedTo)
  const hasInvalidDate = Boolean((requestedFrom && !parsedFrom) || (requestedTo && !parsedTo))
  const reversedRange = Boolean(parsedFrom && parsedTo && parsedFrom > parsedTo)
  const fromDate = !hasInvalidDate && !reversedRange && parsedFrom ? parsedFrom : defaultFrom
  const toDate = !hasInvalidDate && !reversedRange && parsedTo ? parsedTo : defaultTo
  const toExclusive = new Date(toDate)
  toExclusive.setUTCDate(toExclusive.getUTCDate() + 1)
  const dateRange = { gte: fromDate, lt: toExclusive }
  const disbursementWhere: Prisma.LoanWhereInput = {
    status: { in: ['AKTIF', 'LUNAS'] },
    OR: [
      { activatedAt: dateRange },
      { activatedAt: null, approvalHistory: { some: { status: 'AKTIF', createdAt: dateRange } } },
    ],
  }

  const [depositSummary, withdrawalSummary, loanSummary, paymentSummary, savingsRows, loanRows, paymentRows] = await Promise.all([
    prisma.savingsTransaction.aggregate({ where: { date: dateRange, type: 'DEPOSIT' }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.savingsTransaction.aggregate({ where: { date: dateRange, type: 'WITHDRAWAL' }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.loan.aggregate({
      where: disbursementWhere,
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.installmentPayment.aggregate({ where: { date: dateRange }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.savingsTransaction.findMany({
      where: { date: dateRange },
      include: { member: { select: { memberNumber: true, fullName: true } } },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: 20,
    }),
    prisma.loan.findMany({
      where: disbursementWhere,
      include: {
        member: { select: { memberNumber: true, fullName: true } },
        approvalHistory: { where: { status: 'AKTIF' }, orderBy: { createdAt: 'asc' }, take: 1 },
      },
      orderBy: [{ activatedAt: 'desc' }, { createdAt: 'desc' }],
      take: 20,
    }),
    prisma.installmentPayment.findMany({
      where: { date: dateRange },
      include: { schedule: { include: { loan: { include: { member: { select: { memberNumber: true, fullName: true } } } } } } },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: 20,
    }),
  ])

  const zero = new Prisma.Decimal(0)
  const deposits = depositSummary._sum.amount ?? zero
  const withdrawals = withdrawalSummary._sum.amount ?? zero
  const netSavings = deposits.minus(withdrawals)
  const loansDisbursed = loanSummary._sum.amount ?? zero
  const installmentReceipts = paymentSummary._sum.amount ?? zero
  const cards = [
    { label: 'Setoran simpanan', amount: deposits, detail: `${depositSummary._count._all} transaksi`, icon: Wallet, color: 'text-emerald-700 bg-emerald-50' },
    { label: 'Penarikan simpanan', amount: withdrawals, detail: `${withdrawalSummary._count._all} transaksi`, icon: CreditCard, color: 'text-amber-700 bg-amber-50' },
    { label: 'Selisih simpanan', amount: netSavings, detail: 'Setoran dikurangi penarikan', icon: ReceiptText, color: 'text-teal-700 bg-teal-50' },
    { label: 'Pencairan pinjaman', amount: loansDisbursed, detail: `${loanSummary._count._all} pinjaman diaktifkan`, icon: Banknote, color: 'text-blue-700 bg-blue-50' },
    { label: 'Penerimaan angsuran', amount: installmentReceipts, detail: `${paymentSummary._count._all} pembayaran`, icon: CalendarRange, color: 'text-sky-700 bg-sky-50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Rekap Keuangan</h2>
        <p className="mt-1 text-sm text-slate-500">Ringkasan dihitung dari transaksi yang tercatat pada periode pilihan.</p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <form action="/rekap" method="get" className="flex flex-wrap items-end gap-3">
            <label className="min-w-40 flex-1 space-y-1 text-sm">
              <span className="font-medium">Dari tanggal</span>
              <input name="from" type="date" defaultValue={formatDateInput(fromDate)} required className="h-10 w-full rounded-md border border-input bg-background px-3" />
            </label>
            <label className="min-w-40 flex-1 space-y-1 text-sm">
              <span className="font-medium">Sampai tanggal</span>
              <input name="to" type="date" defaultValue={formatDateInput(toDate)} required className="h-10 w-full rounded-md border border-input bg-background px-3" />
            </label>
            <Button type="submit" className="bg-emerald-700 text-white hover:bg-emerald-800">Tampilkan rekap</Button>
          </form>
          {(hasInvalidDate || reversedRange) && (
            <p role="alert" className="mt-3 text-sm text-amber-800">
              {reversedRange ? 'Tanggal awal tidak boleh melewati tanggal akhir.' : 'Format tanggal tidak valid.'} Periode sementara ditampilkan sebagai bulan berjalan.
            </p>
          )}
          <p className="mt-3 text-xs text-slate-500">Periode: {fromDate.toLocaleDateString('id-ID')} – {toDate.toLocaleDateString('id-ID')}</p>
        </CardContent>
      </Card>

      <section aria-label="Ringkasan periode" className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {cards.map((card) => (
          <Card key={card.label} className="min-w-0">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="text-sm text-slate-600">{card.label}</CardTitle>
                <p className="mt-3 break-words text-xl font-semibold text-slate-900 sm:text-2xl">{formatRupiah(card.amount)}</p>
              </div>
              <span className={`grid size-9 shrink-0 place-items-center rounded-md ${card.color}`}><card.icon className="size-4" aria-hidden="true" /></span>
            </CardHeader>
            <CardContent><p className="text-xs text-slate-500">{card.detail}</p></CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader><CardTitle>Rekonsiliasi simpanan</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr><th className="px-4 py-3 font-medium">Komponen</th><th className="px-4 py-3 text-right font-medium">Jumlah transaksi</th><th className="px-4 py-3 text-right font-medium">Nilai</th></tr>
              </thead>
              <tbody>
                <tr className="border-b"><td className="px-4 py-3">Setoran</td><td className="px-4 py-3 text-right">{depositSummary._count._all}</td><td className="px-4 py-3 text-right">{formatRupiah(deposits)}</td></tr>
                <tr className="border-b"><td className="px-4 py-3">Penarikan</td><td className="px-4 py-3 text-right">{withdrawalSummary._count._all}</td><td className="px-4 py-3 text-right">−{formatRupiah(withdrawals)}</td></tr>
                <tr className="bg-slate-50 font-semibold"><td className="px-4 py-3">Selisih simpanan periode</td><td className="px-4 py-3 text-right">-</td><td className="px-4 py-3 text-right">{formatRupiah(netSavings)}</td></tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Transaksi simpanan</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3 font-medium">Tanggal</th><th className="px-4 py-3 font-medium">Anggota</th><th className="px-4 py-3 font-medium">Kategori</th><th className="px-4 py-3 font-medium">Jenis</th><th className="px-4 py-3 text-right font-medium">Nominal</th><th className="px-4 py-3 font-medium">Referensi</th></tr></thead>
              <tbody>
                {savingsRows.map((transaction) => <tr key={transaction.id} className="border-b last:border-0"><td className="whitespace-nowrap px-4 py-3">{transaction.date.toLocaleDateString('id-ID')}</td><td className="px-4 py-3">{transaction.member.fullName}<span className="block text-xs text-slate-500">{transaction.member.memberNumber}</span></td><td className="px-4 py-3">{displayCategory(transaction.category)}</td><td className="px-4 py-3">{transaction.type === 'DEPOSIT' ? 'Setoran' : 'Penarikan'}</td><td className="whitespace-nowrap px-4 py-3 text-right">{formatRupiah(transaction.amount)}</td><td className="px-4 py-3 font-mono text-xs">{transaction.referenceNumber}</td></tr>)}
                {savingsRows.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Tidak ada transaksi simpanan pada periode ini.</td></tr>}
              </tbody>
            </table>
          </div>
          {depositSummary._count._all + withdrawalSummary._count._all > savingsRows.length && <p className="mt-3 text-xs text-slate-500">Menampilkan 20 transaksi terbaru; kartu ringkasan menghitung seluruh transaksi dalam periode.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Pinjaman dicairkan</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3 font-medium">Tanggal aktif</th><th className="px-4 py-3 font-medium">Anggota</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 text-right font-medium">Pokok dicairkan</th><th className="px-4 py-3 font-medium">Tenor</th></tr></thead>
              <tbody>
                {loanRows.map((loan) => {
                  const activationDate = loan.activatedAt ?? loan.approvalHistory[0]?.createdAt
                  return <tr key={loan.id} className="border-b last:border-0"><td className="whitespace-nowrap px-4 py-3">{activationDate?.toLocaleDateString('id-ID') ?? '-'}</td><td className="px-4 py-3">{loan.member.fullName}<span className="block text-xs text-slate-500">{loan.member.memberNumber}</span></td><td className="px-4 py-3">{loan.status === 'LUNAS' ? 'Lunas' : 'Aktif'}</td><td className="whitespace-nowrap px-4 py-3 text-right">{formatRupiah(loan.amount)}</td><td className="px-4 py-3">{loan.termMonths} bulan</td></tr>
                })}
                {loanRows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Tidak ada pinjaman yang diaktifkan pada periode ini.</td></tr>}
              </tbody>
            </table>
          </div>
          {loanSummary._count._all > loanRows.length && <p className="mt-3 text-xs text-slate-500">Menampilkan 20 pinjaman terbaru; total pencairan menghitung semua pinjaman dalam periode.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Penerimaan angsuran</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3 font-medium">Tanggal</th><th className="px-4 py-3 font-medium">Anggota</th><th className="px-4 py-3 font-medium">Referensi</th><th className="px-4 py-3 text-right font-medium">Penerimaan</th></tr></thead>
              <tbody>
                {paymentRows.map((payment) => <tr key={payment.id} className="border-b last:border-0"><td className="whitespace-nowrap px-4 py-3">{payment.date.toLocaleDateString('id-ID')}</td><td className="px-4 py-3">{payment.schedule.loan.member.fullName}<span className="block text-xs text-slate-500">{payment.schedule.loan.member.memberNumber}</span></td><td className="px-4 py-3 font-mono text-xs">{payment.referenceNumber}</td><td className="whitespace-nowrap px-4 py-3 text-right">{formatRupiah(payment.amount)}</td></tr>)}
                {paymentRows.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Tidak ada penerimaan angsuran pada periode ini.</td></tr>}
              </tbody>
            </table>
          </div>
          {paymentSummary._count._all > paymentRows.length && <p className="mt-3 text-xs text-slate-500">Menampilkan 20 pembayaran terbaru; total penerimaan menghitung semua pembayaran dalam periode.</p>}
        </CardContent>
      </Card>
    </div>
  )
}