export const instant = false

import { randomUUID } from 'node:crypto'
import { Fragment } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import LoanApplicationForm from '@/components/forms/LoanApplicationForm'
import LoanCancellationForm from '@/components/forms/LoanCancellationForm'
import prisma from '@/lib/prisma'
import { requireMember } from '@/lib/session'
import { formatRupiah } from '@/lib/utils'
import { canRequestLoanCancellation } from '@/lib/loan-workflow'

const statusLabels: Record<string, string> = {
  DIAJUKAN: 'Menunggu ditinjau',
  DISETUJUI: 'Disetujui',
  DITOLAK: 'Ditolak',
  AKTIF: 'Aktif',
  LUNAS: 'Lunas',
  DIBATALKAN: 'Dibatalkan',
}

export default async function MemberLoansPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const memberId = await requireMember()
  const params = await searchParams
  const loans = await prisma.loan.findMany({
    where: { memberId },
    include: {
      approvalHistory: { orderBy: { createdAt: 'desc' } },
      cancellationRequests: {
        include: { reviewer: { select: { email: true } } },
        orderBy: { createdAt: 'desc' },
      },
      installments: {
        include: { payments: { orderBy: [{ date: 'desc' }, { createdAt: 'desc' }] } },
        orderBy: { dueDate: 'asc' },
      },
    },
    orderBy: [{ applicationDate: 'desc' }, { createdAt: 'desc' }],
  })

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Pinjaman Saya</h2>
        <p className="mt-1 text-sm text-slate-500">Ajukan pinjaman dan pantau keputusan pengurus serta jadwal yang tercatat.</p>
      </div>

      {params.status === 'created' && (
        <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          Pengajuan berhasil dikirim kepada pengurus.
        </p>
      )}
      {(params.status === 'disetujui' || params.status === 'ditolak') && (
        <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          Pengajuan telah diperbarui oleh pengurus.
        </p>
      )}
      {params.status === 'cancellation-requested' && (
        <p role="status" className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Permintaan pembatalan sudah dikirim dan menunggu keputusan pengurus.
        </p>
      )}
      {params.status === 'cancellation-approved' && (
        <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          Permintaan pembatalan disetujui pengurus.
        </p>
      )}
      {params.status === 'cancellation-rejected' && (
        <p role="status" className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Permintaan pembatalan ditolak pengurus. Status pinjaman tetap seperti sebelumnya.
        </p>
      )}

      <Card>
        <CardHeader><CardTitle>Ajukan pinjaman</CardTitle></CardHeader>
        <CardContent>
          <LoanApplicationForm idempotencyKey={randomUUID()} />
        </CardContent>
      </Card>

      <section className="space-y-4" aria-labelledby="loan-history-title">
        <div>
          <h3 id="loan-history-title" className="text-lg font-semibold text-slate-800">Riwayat pengajuan</h3>
        </div>
        {loans.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-sm text-slate-500">Belum ada pengajuan pinjaman.</CardContent></Card>
        ) : loans.map((loan) => {
          const hasPendingCancellation = loan.cancellationRequests.some((request) => request.status === 'MENUNGGU')
          const canCancel = canRequestLoanCancellation({
            status: loan.status,
            activatedAt: loan.activatedAt,
            policyId: loan.policyId,
            scheduleCount: loan.installments.length,
          }) && !hasPendingCancellation

          return (
          <Card key={loan.id}>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>{formatRupiah(loan.amount)}</CardTitle>
                <p className="mt-1 text-sm text-slate-500">Diajukan {loan.applicationDate.toLocaleDateString('id-ID')} · Tenor {loan.termMonths} bulan</p>
              </div>
              <span className="rounded-sm bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{statusLabels[loan.status]}</span>
            </CardHeader>
            <CardContent className="space-y-4">
              {loan.notes && <p className="text-sm text-slate-600">Keterangan: {loan.notes}</p>}
              {hasPendingCancellation && (
                <p className="border-t pt-3 text-sm text-amber-800">Permintaan pembatalan sedang ditinjau pengurus. Keputusan pinjaman menunggu hasil peninjauan ini.</p>
              )}
              {canCancel && (
                <details className="border-t pt-3">
                  <summary className="cursor-pointer text-sm font-medium text-red-700 hover:text-red-900">Ajukan pembatalan pinjaman</summary>
                  <p className="mt-2 text-sm text-slate-600">Permintaan akan ditinjau pengurus. Pinjaman tidak langsung dibatalkan.</p>
                  <LoanCancellationForm loanId={loan.id} />
                </details>
              )}
              {loan.cancellationRequests.length > 0 && (
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium">Riwayat permintaan pembatalan</h4>
                  <ul className="mt-2 space-y-3 text-sm text-slate-600">
                    {loan.cancellationRequests.map((request) => (
                      <li key={request.id}>
                        <p className="font-medium">{request.status === 'MENUNGGU' ? 'Menunggu pengurus' : request.status === 'DISETUJUI' ? 'Disetujui' : 'Ditolak'} · {request.createdAt.toLocaleDateString('id-ID')}</p>
                        <p className="mt-1">Alasan: {request.reason}</p>
                        {request.reviewNotes && <p className="mt-1">Catatan pengurus: {request.reviewNotes}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {loan.approvalHistory.length > 0 && (
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium">Riwayat keputusan</h4>
                  <ul className="mt-2 space-y-2 text-sm text-slate-600">
                    {loan.approvalHistory.map((entry) => (
                      <li key={entry.id} className="flex flex-wrap justify-between gap-2">
                        <span>{statusLabels[entry.status] ?? entry.status}{entry.notes ? ` · ${entry.notes}` : ''}</span>
                        <time dateTime={entry.createdAt.toISOString()} className="text-xs text-slate-500">{entry.createdAt.toLocaleDateString('id-ID')}</time>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {loan.status === 'DISETUJUI' && loan.installments.length === 0 && (
                <p className="border-t pt-3 text-sm text-amber-800">Jadwal angsuran belum tersedia. Pengurus akan memperbarui informasi setelah kebijakan angsuran ditetapkan.</p>
              )}
              {loan.installments.length > 0 && (
                <div className="overflow-x-auto border-t pt-3">
                  <h4 className="mb-2 text-sm font-medium">Jadwal angsuran</h4>
                  <table className="w-full min-w-[480px] text-left text-sm">
                    <thead className="text-xs text-slate-500"><tr><th className="py-2">Jatuh tempo</th><th className="py-2 text-right">Tagihan</th><th className="py-2 text-right">Terbayar</th><th className="py-2">Status</th></tr></thead>
                    <tbody>
                      {loan.installments.map((installment) => (
                        <Fragment key={installment.id}>
                          <tr className="border-t">
                            <td className="py-2">{installment.dueDate.toLocaleDateString('id-ID')}</td>
                            <td className="py-2 text-right">{formatRupiah(installment.amountDue)}</td>
                            <td className="py-2 text-right">{formatRupiah(installment.amountPaid)}</td>
                            <td className="py-2">{statusLabels[installment.status] ?? installment.status}</td>
                          </tr>
                          {installment.payments.map((payment) => (
                            <tr key={payment.id} className="bg-slate-50 text-xs text-slate-600">
                              <td className="py-1.5 pl-4">Pembayaran {payment.date.toLocaleDateString('id-ID')}</td>
                              <td colSpan={2} className="py-1.5 text-right">{formatRupiah(payment.amount)}</td>
                              <td className="py-1.5">{payment.referenceNumber}</td>
                            </tr>
                          ))}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
          )
        })}
      </section>
    </div>
  )
}