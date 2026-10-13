export const instant = false

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { connection } from 'next/server'
import LoanPolicyForm from '@/components/forms/LoanPolicyForm'
import prisma from '@/lib/prisma'

function interestLabel(method: string, annualRate: string) {
  return method === 'NONE' ? 'Tanpa bunga' : `Flat ${annualRate.replace(/\.0+$/, '')}% per tahun`
}

export default async function LoanPolicySettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  await connection()
  const now = new Date()
  const [policies, currentPolicy] = await Promise.all([
    prisma.loanPolicy.findMany({
      include: { createdByUser: { select: { email: true } } },
      orderBy: [{ version: 'desc' }],
    }),
    prisma.loanPolicy.findFirst({
      where: { effectiveFrom: { lte: now } },
      orderBy: [{ effectiveFrom: 'desc' }, { version: 'desc' }],
    }),
  ])

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Kebijakan Pinjaman</h2>
        <p className="mt-1 text-sm text-slate-500">Terbitkan versi kebijakan dengan tanggal berlaku untuk aktivasi pinjaman berikutnya.</p>
      </div>

      {params.status === 'created' && (
        <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          Versi kebijakan berhasil diterbitkan. Pinjaman aktif sebelumnya tidak berubah.
        </p>
      )}

      {currentPolicy ? (
        <Card>
          <CardHeader><CardTitle>Kebijakan yang berlaku saat ini</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div><p className="text-xs text-slate-500">Versi</p><p className="mt-1 font-medium">v{currentPolicy.version} · {currentPolicy.name}</p></div>
            <div><p className="text-xs text-slate-500">Bunga</p><p className="mt-1 font-medium">{interestLabel(currentPolicy.interestMethod, currentPolicy.annualRatePercent.toString())}</p></div>
            <div><p className="text-xs text-slate-500">Tenor maksimum</p><p className="mt-1 font-medium">{currentPolicy.maximumTermMonths} bulan</p></div>
            <div><p className="text-xs text-slate-500">Jatuh tempo</p><p className="mt-1 font-medium">Tanggal {currentPolicy.firstDueDay}</p></div>
          </CardContent>
        </Card>
      ) : (
        <p role="status" className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Belum ada kebijakan yang berlaku. Buat versi kebijakan terlebih dahulu sebelum pinjaman dapat diaktifkan dan dijadwalkan.
        </p>
      )}

      <Card>
        <CardHeader><CardTitle>Terbitkan versi baru</CardTitle></CardHeader>
        <CardContent><LoanPolicyForm /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Riwayat versi kebijakan</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Versi / nama</th>
                  <th className="px-4 py-3 font-medium">Mulai berlaku</th>
                  <th className="px-4 py-3 font-medium">Bunga</th>
                  <th className="px-4 py-3 font-medium">Tenor maksimum</th>
                  <th className="px-4 py-3 font-medium">Jatuh tempo</th>
                  <th className="px-4 py-3 font-medium">Status / pembuat</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((policy) => {
                  const policyStatus = policy.effectiveFrom > now
                    ? 'Belum berlaku'
                    : policy.id === currentPolicy?.id ? 'Berlaku' : 'Riwayat'

                  return (
                    <tr key={policy.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">v{policy.version} · {policy.name}</td>
                      <td className="whitespace-nowrap px-4 py-3">{policy.effectiveFrom.toLocaleDateString('id-ID')}</td>
                      <td className="px-4 py-3">{interestLabel(policy.interestMethod, policy.annualRatePercent.toString())}</td>
                      <td className="px-4 py-3">{policy.maximumTermMonths} bulan</td>
                      <td className="px-4 py-3">Tanggal {policy.firstDueDay}</td>
                      <td className="px-4 py-3"><span className="font-medium">{policyStatus}</span><span className="block text-xs text-slate-500">{policy.createdByUser.email}</span></td>
                    </tr>
                  )
                })}
                {policies.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Belum ada versi kebijakan.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">Versi yang sudah diterbitkan tidak diedit. Untuk koreksi, terbitkan versi baru dengan tanggal berlaku yang sesuai. Versi yang dipakai pinjaman aktif tetap tersimpan pada pinjaman tersebut.</p>
        </CardContent>
      </Card>
    </div>
  )
}