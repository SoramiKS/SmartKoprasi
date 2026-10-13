export const instant = false

import { connection } from 'next/server'
import { CalendarClock, CircleAlert, History } from 'lucide-react'
import { Prisma } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import prisma from '@/lib/prisma'
import { requireMember } from '@/lib/session'
import { formatRupiah } from '@/lib/utils'

function paymentStatus(status: string, dueDate: Date, remaining: Prisma.Decimal, today: string) {
  if (remaining.lte(0) || status === 'LUNAS') return { label: 'Lunas', className: 'bg-emerald-100 text-emerald-800' }
  if (dueDate.toISOString().slice(0, 10) < today) return { label: 'Terlambat', className: 'bg-red-100 text-red-800' }
  if (status === 'SEBAGIAN') return { label: 'Sebagian', className: 'bg-amber-100 text-amber-800' }
  return { label: 'Belum dibayar', className: 'bg-slate-100 text-slate-700' }
}

export default async function MemberInstallmentsPage() {
  const memberId = await requireMember()
  await connection()
  const today = new Date().toISOString().slice(0, 10)
  const schedules = await prisma.installmentSchedule.findMany({
    where: { loan: { memberId } },
    include: {
      loan: { select: { id: true, status: true } },
      payments: { orderBy: [{ date: 'desc' }, { createdAt: 'desc' }] },
    },
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
  })

  const unpaidSchedules = schedules.filter((schedule) => (
    schedule.status !== 'LUNAS' && schedule.amountDue.greaterThan(schedule.amountPaid)
  ))
  const overdueSchedules = unpaidSchedules.filter((schedule) => (
    schedule.dueDate.toISOString().slice(0, 10) < today
  ))
  const nextDue = unpaidSchedules.find((schedule) => schedule.dueDate.toISOString().slice(0, 10) >= today)
  const unpaidTotal = unpaidSchedules.reduce(
    (total, schedule) => total.plus(schedule.amountDue.minus(schedule.amountPaid)),
    new Prisma.Decimal(0),
  )
  const overdueTotal = overdueSchedules.reduce(
    (total, schedule) => total.plus(schedule.amountDue.minus(schedule.amountPaid)),
    new Prisma.Decimal(0),
  )
  const payments = schedules.flatMap((schedule) => schedule.payments.map((payment) => ({
    ...payment,
    loanId: schedule.loan.id,
  }))).sort((left, right) => right.date.getTime() - left.date.getTime())

  const cards = [
    { title: 'Sisa seluruh angsuran', value: formatRupiah(unpaidTotal), detail: `${unpaidSchedules.length} jadwal belum lunas`, icon: History, color: 'text-emerald-700 bg-emerald-50' },
    { title: 'Tagihan menunggak', value: formatRupiah(overdueTotal), detail: `${overdueSchedules.length} jadwal melewati jatuh tempo`, icon: CircleAlert, color: 'text-red-700 bg-red-50' },
    { title: 'Jatuh tempo berikutnya', value: nextDue ? formatRupiah(nextDue.amountDue.minus(nextDue.amountPaid)) : 'Tidak ada', detail: nextDue ? nextDue.dueDate.toLocaleDateString('id-ID') : 'Tidak ada jadwal mendatang', icon: CalendarClock, color: 'text-amber-700 bg-amber-50' },
  ]

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Angsuran Saya</h2>
        <p className="mt-1 text-sm text-slate-500">Jadwal dan pembayaran angsuran yang tercatat untuk akun Anda.</p>
      </div>

      <section aria-label="Ringkasan angsuran pribadi" className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title} className="min-w-0">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="text-sm text-slate-600">{card.title}</CardTitle>
                <p className="mt-3 break-words text-xl font-semibold text-slate-900 sm:text-2xl">{card.value}</p>
              </div>
              <span className={`grid size-9 shrink-0 place-items-center rounded-md ${card.color}`}><card.icon className="size-4" aria-hidden="true" /></span>
            </CardHeader>
            <CardContent><p className="text-xs leading-relaxed text-slate-500">{card.detail}</p></CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader><CardTitle>Jadwal angsuran</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="px-4 py-3 font-medium">Pinjaman</th><th className="px-4 py-3 font-medium">Jatuh tempo</th><th className="px-4 py-3 text-right font-medium">Tagihan</th><th className="px-4 py-3 text-right font-medium">Terbayar</th><th className="px-4 py-3 text-right font-medium">Sisa</th><th className="px-4 py-3 font-medium">Status</th></tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => {
                  const remaining = schedule.amountDue.minus(schedule.amountPaid)
                  const status = paymentStatus(schedule.status, schedule.dueDate, remaining, today)
                  return (
                    <tr key={schedule.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-mono text-xs">{schedule.loan.id}</td>
                      <td className="whitespace-nowrap px-4 py-3">{schedule.dueDate.toLocaleDateString('id-ID')}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">{formatRupiah(schedule.amountDue)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">{formatRupiah(schedule.amountPaid)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium">{formatRupiah(remaining.greaterThan(0) ? remaining : 0)}</td>
                      <td className="px-4 py-3"><span className={`inline-flex rounded-sm px-2 py-1 text-xs font-medium ${status.className}`}>{status.label}</span></td>
                    </tr>
                  )
                })}
                {schedules.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Belum ada jadwal angsuran.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Riwayat pembayaran</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="px-4 py-3 font-medium">Tanggal</th><th className="px-4 py-3 font-medium">Pinjaman</th><th className="px-4 py-3 font-medium">Referensi</th><th className="px-4 py-3 text-right font-medium">Nominal</th></tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b last:border-0">
                    <td className="whitespace-nowrap px-4 py-3">{payment.date.toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-3 font-mono text-xs">{payment.loanId}</td>
                    <td className="px-4 py-3 font-mono text-xs">{payment.referenceNumber}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium">{formatRupiah(payment.amount)}</td>
                  </tr>
                ))}
                {payments.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500">Belum ada riwayat pembayaran.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}