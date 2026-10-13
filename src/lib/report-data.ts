import { Prisma } from '@prisma/client'
import prisma from './prisma'

export const reportTypes = ['anggota', 'simpanan', 'pinjaman', 'angsuran'] as const
export type ReportType = typeof reportTypes[number]

type ReportQuery = {
  type?: string
  from?: string
  to?: string
  memberId?: string
  status?: string
  category?: string
}

export type ReportFilters = {
  type: ReportType
  from: string
  to: string
  fromDate: Date
  toExclusive: Date
  memberId?: string
  status?: string
  category?: 'POKOK' | 'WAJIB' | 'SUKARELA'
  invalidRange: boolean
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

export function parseReportFilters(query: ReportQuery, now = new Date()): ReportFilters {
  const type = reportTypes.find((value) => value === query.type) ?? 'anggota'
  const defaultFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const defaultTo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const parsedFrom = parseDate(query.from)
  const parsedTo = parseDate(query.to)
  const invalidDates = Boolean((query.from && !parsedFrom) || (query.to && !parsedTo))
  const reversed = Boolean(parsedFrom && parsedTo && parsedFrom > parsedTo)
  const fromDate = !invalidDates && !reversed && parsedFrom ? parsedFrom : defaultFrom
  const toDate = !invalidDates && !reversed && parsedTo ? parsedTo : defaultTo
  const toExclusive = new Date(toDate)
  toExclusive.setUTCDate(toExclusive.getUTCDate() + 1)

  const validStatuses: Record<ReportType, string[]> = {
    anggota: ['ACTIVE', 'INACTIVE'],
    simpanan: ['DEPOSIT', 'WITHDRAWAL'],
    pinjaman: ['DIAJUKAN', 'DISETUJUI', 'DITOLAK', 'AKTIF', 'LUNAS', 'DIBATALKAN'],
    angsuran: ['BELUM_DIBAYAR', 'SEBAGIAN', 'LUNAS', 'TERLAMBAT'],
  }
  const validCategories = ['POKOK', 'WAJIB', 'SUKARELA'] as const
  const status = validStatuses[type].includes(query.status ?? '') ? query.status : undefined
  const category = type === 'simpanan' && validCategories.includes(query.category as typeof validCategories[number])
    ? query.category as ReportFilters['category']
    : undefined

  return {
    type,
    from: formatDateInput(fromDate),
    to: formatDateInput(toDate),
    fromDate,
    toExclusive,
    memberId: type === 'anggota' ? undefined : query.memberId || undefined,
    status,
    category,
    invalidRange: invalidDates || reversed,
  }
}

export async function getReportMembers() {
  return prisma.member.findMany({
    orderBy: [{ fullName: 'asc' }, { memberNumber: 'asc' }],
    select: { id: true, memberNumber: true, fullName: true },
  })
}

export async function getReportData(filters: ReportFilters) {
  const range = { gte: filters.fromDate, lt: filters.toExclusive }

  if (filters.type === 'anggota') {
    const where: Prisma.MemberWhereInput = { joinedAt: range }
    if (filters.status === 'ACTIVE' || filters.status === 'INACTIVE') where.status = filters.status
    const rows = await prisma.member.findMany({
      where,
      include: { user: { select: { email: true } } },
      orderBy: [{ joinedAt: 'desc' }, { fullName: 'asc' }],
    })
    return { type: 'anggota' as const, rows }
  }

  if (filters.type === 'simpanan') {
    const where: Prisma.SavingsTransactionWhereInput = { date: range }
    if (filters.memberId) where.memberId = filters.memberId
    if (filters.status === 'DEPOSIT' || filters.status === 'WITHDRAWAL') where.type = filters.status
    if (filters.category) where.category = filters.category
    const rows = await prisma.savingsTransaction.findMany({
      where,
      include: { member: { select: { memberNumber: true, fullName: true } } },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    })
    return { type: 'simpanan' as const, rows }
  }

  if (filters.type === 'pinjaman') {
    const where: Prisma.LoanWhereInput = { applicationDate: range }
    if (filters.memberId) where.memberId = filters.memberId
    if (filters.status) where.status = filters.status as 'DIAJUKAN' | 'DISETUJUI' | 'DITOLAK' | 'AKTIF' | 'LUNAS' | 'DIBATALKAN'
    const rows = await prisma.loan.findMany({
      where,
      include: { member: { select: { memberNumber: true, fullName: true } } },
      orderBy: [{ applicationDate: 'desc' }, { createdAt: 'desc' }],
    })
    return { type: 'pinjaman' as const, rows }
  }

  const where: Prisma.InstallmentScheduleWhereInput = { dueDate: range }
  if (filters.memberId) where.loan = { memberId: filters.memberId }
  if (filters.status) where.status = filters.status as 'BELUM_DIBAYAR' | 'SEBAGIAN' | 'LUNAS' | 'TERLAMBAT'
  const rows = await prisma.installmentSchedule.findMany({
    where,
    include: { loan: { include: { member: { select: { memberNumber: true, fullName: true } } } } },
    orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }],
  })
  return { type: 'angsuran' as const, rows }
}

function csvCell(value: string | number | null | undefined) {
  const cell = String(value ?? '')
  const safeCell = /^[=+\-@\t\r]/.test(cell) ? `'${cell}` : cell
  return `"${safeCell.replaceAll('"', '""')}"`
}

function csvRow(values: (string | number | null | undefined)[]) {
  return values.map(csvCell).join(',')
}

function csvDate(date: Date) {
  return date.toLocaleDateString('id-ID')
}

export function serializeReportCsv(data: Awaited<ReturnType<typeof getReportData>>) {
  if (data.type === 'anggota') {
    return [
      csvRow(['Nomor Anggota', 'Nama Lengkap', 'Telepon', 'Email', 'Tanggal Bergabung', 'Status']),
      ...data.rows.map((member) => csvRow([
        member.memberNumber,
        member.fullName,
        member.phone,
        member.user?.email,
        csvDate(member.joinedAt),
        member.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif',
      ])),
    ].join('\r\n')
  }

  if (data.type === 'simpanan') {
    return [
      csvRow(['Tanggal', 'Referensi', 'Anggota', 'Nomor Anggota', 'Kategori', 'Jenis', 'Nominal', 'Catatan']),
      ...data.rows.map((transaction) => csvRow([
        csvDate(transaction.date),
        transaction.referenceNumber,
        transaction.member.fullName,
        transaction.member.memberNumber,
        transaction.category,
        transaction.type === 'DEPOSIT' ? 'Setoran' : 'Penarikan',
        transaction.amount.toString(),
        transaction.notes,
      ])),
    ].join('\r\n')
  }

  if (data.type === 'pinjaman') {
    return [
      csvRow(['Tanggal Pengajuan', 'Nomor Pinjaman', 'Anggota', 'Nomor Anggota', 'Jumlah', 'Tenor Bulan', 'Status']),
      ...data.rows.map((loan) => csvRow([
        csvDate(loan.applicationDate),
        loan.id,
        loan.member.fullName,
        loan.member.memberNumber,
        loan.amount.toString(),
        loan.termMonths,
        loan.status,
      ])),
    ].join('\r\n')
  }

  return [
    csvRow(['Jatuh Tempo', 'Anggota', 'Nomor Anggota', 'Nominal Tagihan', 'Terbayar', 'Sisa', 'Status']),
    ...data.rows.map((schedule) => csvRow([
      csvDate(schedule.dueDate),
      schedule.loan.member.fullName,
      schedule.loan.member.memberNumber,
      schedule.amountDue.toString(),
      schedule.amountPaid.toString(),
      schedule.amountDue.minus(schedule.amountPaid).toString(),
      schedule.status,
    ])),
  ].join('\r\n')
}