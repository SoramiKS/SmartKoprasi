export const instant = false

import prisma from '@/lib/prisma'
import { requireMember } from '@/lib/session'
import { calculateSavingsBalance } from '@/lib/financial'
import { formatRupiah } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function categoryLabel(category: string) {
  if (category === 'POKOK') return 'Simpanan Pokok'
  if (category === 'WAJIB') return 'Simpanan Wajib'
  return 'Simpanan Sukarela'
}

export default async function MemberSavingsPage() {
  const memberId = await requireMember()
  const transactions = await prisma.savingsTransaction.findMany({
    where: { memberId },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  })
  const balance = calculateSavingsBalance(transactions)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Simpanan Saya</h2>
        <p className="mt-1 text-sm text-slate-500">Saldo dan riwayat transaksi simpanan Anda.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Saldo simpanan tercatat</CardTitle></CardHeader>
        <CardContent><p className="text-3xl font-semibold text-emerald-800">{formatRupiah(balance)}</p></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Riwayat transaksi</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Tanggal</th>
                  <th className="px-4 py-3 font-medium">Referensi</th>
                  <th className="px-4 py-3 font-medium">Kategori</th>
                  <th className="px-4 py-3 font-medium">Jenis</th>
                  <th className="px-4 py-3 text-right font-medium">Nominal</th>
                  <th className="px-4 py-3 font-medium">Catatan</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b last:border-0">
                    <td className="whitespace-nowrap px-4 py-3">{transaction.date.toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-3 font-mono text-xs">{transaction.referenceNumber}</td>
                    <td className="px-4 py-3">{categoryLabel(transaction.category)}</td>
                    <td className="px-4 py-3">{transaction.type === 'DEPOSIT' ? 'Setoran' : 'Penarikan'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium">{formatRupiah(transaction.amount)}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-500" title={transaction.notes ?? undefined}>{transaction.notes ?? '-'}</td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Belum ada transaksi simpanan.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}