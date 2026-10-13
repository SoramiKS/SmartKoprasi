export const instant = false;
import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, CreditCard, Banknote, History, CalendarClock } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import {
  calculateInstallmentTotal,
  calculateOutstandingPrincipal,
  calculateSavingsBalance,
} from '@/lib/financial'

export default async function DashboardPage() {
  const [
    totalMembers,
    savingsTransactions,
    loans,
    installments
  ] = await Promise.all([
    prisma.member.count({ where: { status: 'ACTIVE' } }),
    prisma.savingsTransaction.findMany(),
    prisma.loan.findMany({
      where: { status: { in: ['AKTIF', 'LUNAS'] } },
      include: { installments: true },
    }),
    prisma.installmentSchedule.findMany()
  ])

  const totalSavings = calculateSavingsBalance(savingsTransactions)
  const outstandingPrincipal = calculateOutstandingPrincipal(loans)
  const dueInstallments = calculateInstallmentTotal(installments, ['BELUM_DIBAYAR', 'SEBAGIAN', 'TERLAMBAT'])
  const today = new Date().toISOString().slice(0, 10)
  const overdueInstallments = calculateInstallmentTotal(
    installments.filter((installment) => installment.status !== 'LUNAS' && installment.dueDate.toISOString().slice(0, 10) < today),
    ['BELUM_DIBAYAR', 'SEBAGIAN', 'TERLAMBAT'],
  )

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Dashboard Utama</h2>

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-6 2xl:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Anggota Aktif</CardTitle>
            <Users className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Simpanan</CardTitle>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(totalSavings)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Pinjaman Aktif</CardTitle>
            <Banknote className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(outstandingPrincipal)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Angsuran Belum Lunas</CardTitle>
            <CalendarClock className="w-4 h-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(dueInstallments)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Tagihan Menunggak</CardTitle>
            <History className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatRupiah(overdueInstallments)}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-white p-6 rounded-xl border">
        <p className="text-slate-500 text-sm">Catatan: Grafik aktivitas simpanan dan pinjaman akan ditampilkan di sini.</p>
      </div>
    </div>
  )
}
