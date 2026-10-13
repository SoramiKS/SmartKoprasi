export const instant = false;
import prisma from '@/lib/prisma'
import { requireMember } from '@/lib/session'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, Banknote, History, Bell } from 'lucide-react'
import Link from 'next/link'
import { formatRupiah } from '@/lib/utils'
import { calculateOutstandingPrincipal, calculateSavingsBalance } from '@/lib/financial'

export default async function PortalDashboard() {
  const memberId = await requireMember()

  const [
    member,
    savingsTransactions,
    activeLoans,
    announcements
  ] = await Promise.all([
    prisma.member.findUnique({ where: { id: memberId } }),
    prisma.savingsTransaction.findMany({ where: { memberId } }),
    prisma.loan.findMany({ 
      where: { memberId, status: { in: ['AKTIF', 'LUNAS'] } },
      include: { installments: { orderBy: { dueDate: 'asc' } } }
    }),
    prisma.announcement.findMany({ orderBy: { createdAt: 'desc' }, take: 3 })
  ])

  // Calculate totals
  const totalSavings = calculateSavingsBalance(savingsTransactions)
  const outstandingPrincipal = calculateOutstandingPrincipal(activeLoans)

  const nextInstallment = activeLoans
    .flatMap((loan) => loan.installments)
    .find((installment) => installment.status !== 'LUNAS')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Selamat datang, {member?.fullName}</h2>
          <p className="mt-1 text-sm text-slate-500">Ringkasan simpanan dan pinjaman Anda.</p>
        </div>
        <Link href="/portal/profil" className="text-sm font-medium text-emerald-800 hover:underline">
          Lihat profil
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Saldo Simpanan</CardTitle>
            <Wallet className="w-4 h-4 text-emerald-600" />
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
            <CardTitle className="text-sm font-medium text-slate-500">Tagihan Berikutnya</CardTitle>
            <History className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {nextInstallment 
                ? formatRupiah(nextInstallment.amountDue.minus(nextInstallment.amountPaid))
                : 'Tidak ada'
              }
            </div>
            {nextInstallment && (
              <p className="text-xs text-slate-500 mt-1">
                Jatuh tempo: {new Date(nextInstallment.dueDate).toLocaleDateString('id-ID')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="rounded-xl border bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Bell className="size-5 text-emerald-600" /> Pengumuman Terbaru
          </h3>
          <Link href="/portal/pengumuman" className="text-sm font-medium text-emerald-800 hover:underline">
            Lihat semua
          </Link>
        </div>
        {announcements.length > 0 ? (
          <div className="space-y-4">
            {announcements.map((ann) => (
              <div key={ann.id} className="pb-4 border-b last:border-0 last:pb-0">
                <h4 className="font-medium text-slate-800">{ann.title}</h4>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-500">{ann.content}</p>
                <p className="text-xs text-slate-400 mt-2">
                  {new Date(ann.createdAt).toLocaleDateString('id-ID')}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">Belum ada pengumuman.</p>
        )}
      </div>
    </div>
  )
}
