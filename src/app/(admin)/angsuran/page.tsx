export const instant = false

import { randomUUID } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { Banknote, CalendarClock, CircleAlert, History } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import InstallmentPaymentForm from '@/components/forms/InstallmentPaymentForm'
import prisma from '@/lib/prisma'
import { calculateInstallmentTotal } from '@/lib/financial'
import { formatRupiah } from '@/lib/utils'

function displayedStatus(status: string, dueDate: Date, hasRemaining: boolean, today: string) {
  if (status === 'LUNAS' || !hasRemaining) return { label: 'Lunas', className: 'bg-emerald-100 text-emerald-800' }
  if (status === 'TERLAMBAT' || dueDate.toISOString().slice(0, 10) < today) return { label: 'Terlambat', className: 'bg-red-100 text-red-800' }
  if (status === 'SEBAGIAN') return { label: 'Sebagian', className: 'bg-amber-100 text-amber-800' }
  return { label: 'Belum dibayar', className: 'bg-slate-100 text-slate-700' }
}

export default async function AngsuranPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const today = new Date().toISOString().slice(0, 10)
  const todayDate = new Date(`${today}T00:00:00.000Z`)
  const monthStart = new Date(Date.UTC(todayDate.getUTCFullYear(), todayDate.getUTCMonth(), 1))
  const nextMonthStart = new Date(Date.UTC(todayDate.getUTCFullYear(), todayDate.getUTCMonth() + 1, 1))
  const [schedules, payments, monthPaymentSummary] = await Promise.all([
    prisma.installmentSchedule.findMany({
      include: { loan: { include: { member: { select: { memberNumber: true, fullName: true } } } } },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.installmentPayment.findMany({
      include: {
        schedule: {
          include: { loan: { include: { member: { select: { memberNumber: true, fullName: true } } } } },
        },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: 30,
    }),
    prisma.installmentPayment.aggregate({
      where: { date: { gte: monthStart, lt: nextMonthStart } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ])

  const unpaidSchedules = schedules.filter((schedule) => (
    schedule.status !== 'LUNAS' && schedule.amountDue.greaterThan(schedule.amountPaid)
  ))
  const overdueSchedules = unpaidSchedules.filter((schedule) => (
    schedule.dueDate.toISOString().slice(0, 10) < today
  ))
  const monthSchedules = unpaidSchedules.filter((schedule) => (
    schedule.dueDate >= monthStart && schedule.dueDate < nextMonthStart
  ))
  const unpaidTotal = calculateInstallmentTotal(unpaidSchedules, ['BELUM_DIBAYAR', 'SEBAGIAN', 'TERLAMBAT'])
  const overdueTotal = calculateInstallmentTotal(overdueSchedules, ['BELUM_DIBAYAR', 'SEBAGIAN', 'TERLAMBAT'])
  const monthDueTotal = calculateInstallmentTotal(monthSchedules, ['BELUM_DIBAYAR', 'SEBAGIAN', 'TERLAMBAT'])
  const monthPaymentTotal = monthPaymentSummary._sum.amount ?? new Prisma.Decimal(0)
  const overview = [
    {
      title: 'Sisa angsuran',
      value: formatRupiah(unpaidTotal),
      detail: `${unpaidSchedules.length} jadwal belum lunas`,
      icon: Banknote,
      iconClass: 'text-emerald-700 bg-emerald-50',
    },
    {
      title: 'Jatuh tempo bulan ini',
      value: formatRupiah(monthDueTotal),
      detail: `${monthSchedules.length} jadwal belum lunas`,
      icon: CalendarClock,
      iconClass: 'text-amber-700 bg-amber-50',
    },
    {
      title: 'Tagihan menunggak',
      value: formatRupiah(overdueTotal),
      detail: `${overdueSchedules.length} jadwal melewati jatuh tempo`,
      icon: CircleAlert,
      iconClass: 'text-red-700 bg-red-50',
    },
    {
      title: 'Pembayaran bulan ini',
      value: formatRupiah(monthPaymentTotal),
      detail: `${monthPaymentSummary._count._all} pembayaran tercatat`,
      icon: History,
      iconClass: 'text-sky-700 bg-sky-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Manajemen Angsuran</h2>
        <p className="mt-1 text-sm text-slate-500">Pantau jadwal, sisa pembayaran, dan riwayat penerimaan angsuran.</p>
      </div>

      {params.status === 'created' && (
        <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          Pembayaran angsuran berhasil dicatat.
        </p>
      )}

      <section aria-label="Ringkasan angsuran" className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overview.map((metric) => (
          <Card key={metric.title} className="min-w-0">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="text-sm text-slate-600">{metric.title}</CardTitle>
                <p className="mt-3 break-words text-xl font-semibold text-slate-900 sm:text-2xl">{metric.value}</p>
              </div>
              <span className={`grid size-9 shrink-0 place-items-center rounded-md ${metric.iconClass}`}>
                <metric.icon className="size-4" aria-hidden="true" />
              </span>
            </CardHeader>
            <CardContent><p className="text-xs leading-relaxed text-slate-500">{metric.detail}</p></CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader><CardTitle>Jadwal pembayaran</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Anggota / Pinjaman</th>
                  <th className="px-4 py-3 font-medium">Jatuh tempo</th>
                  <th className="px-4 py-3 font-medium text-right">Tagihan</th>
                  <th className="px-4 py-3 font-medium text-right">Terbayar</th>
                  <th className="px-4 py-3 font-medium text-right">Sisa</th>
                  <th className="px-4 py-3 font-medium">Status / tindakan</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => {
                  const remaining = schedule.amountDue.minus(schedule.amountPaid)
                  const status = displayedStatus(schedule.status, schedule.dueDate, remaining.greaterThan(0), today)
                  const canRecordPayment = schedule.loan.status === 'AKTIF' && remaining.greaterThan(0)

                  return (
                    <tr key={schedule.id} className="border-b align-top last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{schedule.loan.member.fullName}</p>
                        <p className="text-xs text-slate-500">{schedule.loan.member.memberNumber}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{schedule.dueDate.toLocaleDateString('id-ID')}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">{formatRupiah(schedule.amountDue)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">{formatRupiah(schedule.amountPaid)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium">{formatRupiah(remaining.greaterThan(0) ? remaining : 0)}</td>
                      <td className="min-w-[260px] px-4 py-3">
                        <span className={`inline-flex rounded-sm px-2 py-1 text-xs font-medium ${status.className}`}>{status.label}</span>
                        {canRecordPayment && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-sm font-medium text-emerald-800 hover:text-emerald-950">Catat pembayaran</summary>
                            <InstallmentPaymentForm
                              scheduleId={schedule.id}
                              remaining={remaining.toString()}
                              paymentKey={randomUUID()}
                              today={today}
                            />
                          </details>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {schedules.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Belum ada jadwal angsuran.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Riwayat pembayaran terbaru</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Tanggal</th>
                  <th className="px-4 py-3 font-medium">Anggota</th>
                  <th className="px-4 py-3 font-medium">Referensi</th>
                  <th className="px-4 py-3 font-medium text-right">Nominal</th>
                  <th className="px-4 py-3 font-medium">Catatan</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b last:border-0">
                    <td className="whitespace-nowrap px-4 py-3">{payment.date.toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-3">{payment.schedule.loan.member.fullName}</td>
                    <td className="px-4 py-3 font-mono text-xs">{payment.referenceNumber}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium">{formatRupiah(payment.amount)}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-500" title={payment.notes ?? undefined}>{payment.notes ?? '-'}</td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">Belum ada pembayaran angsuran.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {payments.length === 30 && <p className="mt-3 text-xs text-slate-500">Menampilkan 30 pembayaran terbaru.</p>}
        </CardContent>
      </Card>
    </div>
  )
}