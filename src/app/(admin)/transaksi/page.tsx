export const instant = false

import { randomUUID } from 'node:crypto'
import Link from 'next/link'
import { Prisma } from '@prisma/client'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import SavingsTransactionForm from '@/components/forms/SavingsTransactionForm'
import prisma from '@/lib/prisma'
import { formatRupiah } from '@/lib/utils'

const pageSize = 20

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function singleValue(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : undefined
}

function dateFilter(value: string | undefined, endOfDay = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const date = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return undefined
  if (endOfDay) date.setUTCHours(23, 59, 59, 999)
  return date
}

function categoryLabel(category: string) {
  if (category === 'POKOK') return 'Simpanan Pokok'
  if (category === 'WAJIB') return 'Simpanan Wajib'
  return 'Simpanan Sukarela'
}

export default async function TransaksiPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const search = singleValue(params.q)?.trim() ?? ''
  const type = singleValue(params.type)
  const category = singleValue(params.category)
  const dateFrom = dateFilter(singleValue(params.from))
  const dateTo = dateFilter(singleValue(params.to), true)
  const requestedPage = Number(singleValue(params.page) ?? '1')
  const safeRequestedPage = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1

  const where: Prisma.SavingsTransactionWhereInput = {}
  if (type === 'DEPOSIT' || type === 'WITHDRAWAL') where.type = type
  if (category === 'POKOK' || category === 'WAJIB' || category === 'SUKARELA') where.category = category
  if (dateFrom || dateTo) where.date = { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) }
  if (search) {
    where.OR = [
      { referenceNumber: { contains: search, mode: 'insensitive' } },
      { member: { fullName: { contains: search, mode: 'insensitive' } } },
      { member: { memberNumber: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const [members, totalRows] = await Promise.all([
    prisma.member.findMany({ orderBy: { fullName: 'asc' }, select: { id: true, memberNumber: true, fullName: true } }),
    prisma.savingsTransaction.count({ where }),
  ])
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize))
  const currentPage = Math.min(safeRequestedPage, pageCount)
  const transactions = await prisma.savingsTransaction.findMany({
    where,
    include: { member: { select: { memberNumber: true, fullName: true } } },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  })

  const paginationParams = new URLSearchParams()
  if (search) paginationParams.set('q', search)
  if (type === 'DEPOSIT' || type === 'WITHDRAWAL') paginationParams.set('type', type)
  if (category === 'POKOK' || category === 'WAJIB' || category === 'SUKARELA') paginationParams.set('category', category)
  if (singleValue(params.from)) paginationParams.set('from', singleValue(params.from)!)
  if (singleValue(params.to)) paginationParams.set('to', singleValue(params.to)!)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Transaksi Simpanan</h2>
        <p className="mt-1 text-sm text-slate-500">Catat setoran dan penarikan dengan riwayat yang dapat ditelusuri.</p>
      </div>

      {singleValue(params.status) === 'created' && (
        <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          Transaksi berhasil dicatat.
        </p>
      )}

      <Card>
        <CardHeader><CardTitle>Catat transaksi baru</CardTitle></CardHeader>
        <CardContent>
          <SavingsTransactionForm
            members={members}
            transactionKey={randomUUID()}
            today={new Date().toISOString().slice(0, 10)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Riwayat transaksi</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form action="/transaksi" method="get" className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <label className="space-y-1 text-sm xl:col-span-2">
              <span className="font-medium">Cari anggota atau referensi</span>
              <input name="q" defaultValue={search} className="h-10 w-full rounded-md border border-input bg-background px-3" />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Transaksi</span>
              <select name="type" defaultValue={type ?? ''} className="h-10 w-full rounded-md border border-input bg-background px-3">
                <option value="">Semua</option>
                <option value="DEPOSIT">Setoran</option>
                <option value="WITHDRAWAL">Penarikan</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Kategori</span>
              <select name="category" defaultValue={category ?? ''} className="h-10 w-full rounded-md border border-input bg-background px-3">
                <option value="">Semua</option>
                <option value="POKOK">Simpanan Pokok</option>
                <option value="WAJIB">Simpanan Wajib</option>
                <option value="SUKARELA">Simpanan Sukarela</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Dari tanggal</span>
              <input name="from" type="date" defaultValue={singleValue(params.from)} className="h-10 w-full rounded-md border border-input bg-background px-3" />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Sampai tanggal</span>
              <input name="to" type="date" defaultValue={singleValue(params.to)} className="h-10 w-full rounded-md border border-input bg-background px-3" />
            </label>
            <div className="flex items-end gap-2 md:col-span-2 xl:col-span-6">
              <Button type="submit" variant="outline">Terapkan filter</Button>
              <a href="/transaksi" className="inline-flex h-10 items-center px-3 text-sm text-slate-600 hover:text-emerald-800">Reset</a>
            </div>
          </form>

          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Tanggal</th>
                  <th className="px-4 py-3 font-medium">Anggota</th>
                  <th className="px-4 py-3 font-medium">Kategori</th>
                  <th className="px-4 py-3 font-medium">Jenis</th>
                  <th className="px-4 py-3 font-medium text-right">Nominal</th>
                  <th className="px-4 py-3 font-medium">Referensi dan catatan</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b last:border-0">
                    <td className="whitespace-nowrap px-4 py-3">{transaction.date.toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{transaction.member.fullName}</p>
                      <p className="text-xs text-slate-500">{transaction.member.memberNumber}</p>
                    </td>
                    <td className="px-4 py-3">{categoryLabel(transaction.category)}</td>
                    <td className="px-4 py-3">{transaction.type === 'DEPOSIT' ? 'Setoran' : 'Penarikan'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium">{formatRupiah(transaction.amount)}</td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs">{transaction.referenceNumber}</p>
                      {transaction.notes && <p className="mt-1 max-w-xs truncate text-xs text-slate-500" title={transaction.notes}>{transaction.notes}</p>}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Belum ada transaksi sesuai filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
            <span>{totalRows} transaksi · Halaman {currentPage} dari {pageCount}</span>
            <div className="flex gap-2">
              {currentPage > 1 ? (
                <Link className={buttonVariants({ variant: 'outline', size: 'sm' })} href={`/transaksi?${paginationParams.toString()}${paginationParams.size ? '&' : ''}page=${currentPage - 1}`}>Sebelumnya</Link>
              ) : <Button variant="outline" size="sm" disabled>Sebelumnya</Button>}
              {currentPage < pageCount ? (
                <Link className={buttonVariants({ variant: 'outline', size: 'sm' })} href={`/transaksi?${paginationParams.toString()}${paginationParams.size ? '&' : ''}page=${currentPage + 1}`}>Berikutnya</Link>
              ) : <Button variant="outline" size="sm" disabled>Berikutnya</Button>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}