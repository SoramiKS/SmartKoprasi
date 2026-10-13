export const instant = false

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import LoanDecisionForm from '@/components/forms/LoanDecisionForm'
import LoanActivationForm from '@/components/forms/LoanActivationForm'
import LoanCancellationReviewForm from '@/components/forms/LoanCancellationReviewForm'
import prisma from '@/lib/prisma'
import { formatRupiah } from '@/lib/utils'

const statusLabels: Record<string, string> = {
  DIAJUKAN: 'Diajukan',
  DISETUJUI: 'Disetujui',
  DITOLAK: 'Ditolak',
  AKTIF: 'Aktif',
  LUNAS: 'Lunas',
  DIBATALKAN: 'Dibatalkan',
  BELUM_DIBAYAR: 'Belum dibayar',
  SEBAGIAN: 'Sebagian',
  TERLAMBAT: 'Terlambat',
}

export default async function LoanDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ status?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  await connection()
  const now = new Date()
  const [loan, currentPolicy] = await Promise.all([prisma.loan.findUnique({
    where: { id },
    include: {
      member: { include: { user: { select: { email: true } } } },
      policy: true,
      cancellationRequests: {
        include: {
          requester: { select: { email: true } },
          reviewer: { select: { email: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      approvalHistory: {
        include: { createdByUser: { select: { email: true } } },
        orderBy: { createdAt: 'desc' },
      },
      installments: {
        include: { payments: { orderBy: { date: 'desc' } } },
        orderBy: { dueDate: 'asc' },
      },
    },
  }), prisma.loanPolicy.findFirst({
    where: { effectiveFrom: { lte: now } },
    orderBy: [{ effectiveFrom: 'desc' }, { version: 'desc' }],
  })])
  if (!loan) notFound()
  const hasPendingCancellation = loan.cancellationRequests.some((request) => request.status === 'MENUNGGU')

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link href="/pinjaman" className="text-sm text-emerald-800 hover:underline">Kembali ke pinjaman</Link>
        <h2 className="mt-2 text-2xl font-bold text-slate-800">Detail Pengajuan Pinjaman</h2>
      </div>

      {query.status === 'activated' && (
        <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          Pinjaman aktif dan jadwal angsuran berhasil dibuat.
        </p>
      )}
      {query.status === 'cancellation-approved' && (
        <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Permintaan pembatalan disetujui; pinjaman telah dibatalkan.</p>
      )}
      {query.status === 'cancellation-rejected' && (
        <p role="status" className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Permintaan pembatalan ditolak; status pinjaman tetap seperti sebelumnya.</p>
      )}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>{loan.member.fullName}</CardTitle>
            <p className="mt-1 text-sm text-slate-500">{loan.member.memberNumber} · {loan.member.user?.email ?? 'Tanpa akun email'}</p>
          </div>
          <span className="rounded-sm bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{statusLabels[loan.status]}</span>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div><dt className="text-xs text-slate-500">Jumlah pinjaman</dt><dd className="mt-1 font-semibold">{formatRupiah(loan.amount)}</dd></div>
            <div><dt className="text-xs text-slate-500">Tenor</dt><dd className="mt-1 font-semibold">{loan.termMonths} bulan</dd></div>
            <div><dt className="text-xs text-slate-500">Tanggal pengajuan</dt><dd className="mt-1 font-semibold">{loan.applicationDate.toLocaleDateString('id-ID')}</dd></div>
            <div><dt className="text-xs text-slate-500">Nomor telepon anggota</dt><dd className="mt-1 font-semibold">{loan.member.phone}</dd></div>
            <div className="sm:col-span-2"><dt className="text-xs text-slate-500">Keterangan pengajuan</dt><dd className="mt-1">{loan.notes || '-'}</dd></div>
          </dl>
        </CardContent>
      </Card>

      {loan.status === 'DIAJUKAN' && !hasPendingCancellation && (
        <Card>
          <CardHeader><CardTitle>Tinjau pengajuan</CardTitle></CardHeader>
          <CardContent><LoanDecisionForm loanId={loan.id} /></CardContent>
        </Card>
      )}

      {loan.cancellationRequests.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Permintaan pembatalan dari anggota</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {loan.cancellationRequests.map((request) => (
              <div key={request.id} className="space-y-3 border-b pb-4 last:border-0 last:pb-0">
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-medium">{request.status === 'MENUNGGU' ? 'Menunggu review' : request.status === 'DISETUJUI' ? 'Disetujui' : 'Ditolak'}</p>
                  <p className="text-xs text-slate-500">{request.createdAt.toLocaleDateString('id-ID')} · {request.requester.email}</p>
                </div>
                <p className="text-sm text-slate-700">Alasan anggota: {request.reason}</p>
                {request.reviewNotes && <p className="text-sm text-slate-600">Catatan pengurus: {request.reviewNotes}</p>}
                {request.status === 'MENUNGGU' && <LoanCancellationReviewForm requestId={request.id} />}
                {request.reviewer && request.reviewedAt && <p className="text-xs text-slate-500">Ditinjau {request.reviewedAt.toLocaleDateString('id-ID')} oleh {request.reviewer.email}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {loan.status === 'DISETUJUI' && !hasPendingCancellation && loan.installments.length === 0 && !currentPolicy && (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Belum ada kebijakan yang berlaku, sehingga pinjaman belum dapat diaktifkan.{' '}
          <Link href="/pengaturan/pinjaman" className="font-medium underline">Atur kebijakan pinjaman</Link>.
        </p>
      )}

      {loan.status === 'DISETUJUI' && !hasPendingCancellation && loan.installments.length === 0 && currentPolicy && loan.termMonths > currentPolicy.maximumTermMonths && (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Tenor pengajuan {loan.termMonths} bulan melebihi tenor maksimum {currentPolicy.maximumTermMonths} bulan pada kebijakan v{currentPolicy.version}. Terbitkan kebijakan yang sesuai atau tinjau pengajuan ini kembali.
        </p>
      )}

      {loan.status === 'DISETUJUI' && !hasPendingCancellation && loan.installments.length === 0 && currentPolicy && loan.termMonths <= currentPolicy.maximumTermMonths && (
        <Card>
          <CardHeader><CardTitle>Aktifkan pinjaman</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-medium">Kebijakan v{currentPolicy.version} · {currentPolicy.name}</p>
              <p className="mt-1">{currentPolicy.interestMethod === 'NONE' ? 'Tanpa bunga' : `Bunga flat ${currentPolicy.annualRatePercent.toString()}% per tahun, prorata tenor`} · jatuh tempo tanggal {currentPolicy.firstDueDay}</p>
              <p className="mt-1 text-xs text-slate-500">Jadwal bulanan dimulai bulan berikutnya. Angsuran terakhir menyesuaikan pembulatan.</p>
            </div>
            <LoanActivationForm loanId={loan.id} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Riwayat persetujuan</CardTitle></CardHeader>
        <CardContent>
          {loan.approvalHistory.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada riwayat keputusan.</p>
          ) : (
            <ol className="space-y-4">
              {loan.approvalHistory.map((entry) => (
                <li key={entry.id} className="border-l-2 border-emerald-200 pl-4">
                  <p className="font-medium">{statusLabels[entry.status] ?? entry.status}</p>
                  <p className="mt-1 text-sm text-slate-600">{entry.notes || 'Tanpa catatan'}</p>
                  <p className="mt-1 text-xs text-slate-500">{entry.createdAt.toLocaleDateString('id-ID')} · {entry.createdByUser.email}</p>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {loan.installments.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Jadwal angsuran</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                  <tr><th className="px-4 py-3 font-medium">Jatuh tempo</th><th className="px-4 py-3 text-right font-medium">Tagihan</th><th className="px-4 py-3 text-right font-medium">Terbayar</th><th className="px-4 py-3 text-right font-medium">Sisa</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Pembayaran</th></tr>
                </thead>
                <tbody>
                  {loan.installments.map((schedule) => (
                    <tr key={schedule.id} className="border-b last:border-0">
                      <td className="whitespace-nowrap px-4 py-3">{schedule.dueDate.toLocaleDateString('id-ID')}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">{formatRupiah(schedule.amountDue)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">{formatRupiah(schedule.amountPaid)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">{formatRupiah(schedule.amountDue.minus(schedule.amountPaid))}</td>
                      <td className="px-4 py-3">{statusLabels[schedule.status]}</td>
                      <td className="px-4 py-3">{schedule.payments.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {loan.policy && (
        <Card>
          <CardHeader><CardTitle>Kebijakan yang diterapkan</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div><p className="text-xs text-slate-500">Versi</p><p className="mt-1 font-medium">v{loan.appliedPolicyVersion} · {loan.policy.name}</p></div>
            <div><p className="text-xs text-slate-500">Metode bunga</p><p className="mt-1 font-medium">{loan.appliedInterestMethod === 'NONE' ? 'Tanpa bunga' : `Flat ${loan.appliedAnnualRatePercent?.toString()}% per tahun`}</p></div>
            <div><p className="text-xs text-slate-500">Total pembayaran</p><p className="mt-1 font-medium">{loan.totalRepaymentAmount ? formatRupiah(loan.totalRepaymentAmount) : '-'}</p></div>
            <div><p className="text-xs text-slate-500">Diaktifkan</p><p className="mt-1 font-medium">{loan.activatedAt?.toLocaleDateString('id-ID') ?? '-'}</p></div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}