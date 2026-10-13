import { describe, expect, it } from 'vitest'
import { parseReportFilters } from './report-data'

describe('report filters', () => {
  const now = new Date('2026-10-08T12:00:00.000Z')

  it('keeps a valid report type, inclusive date range, member, status, and category', () => {
    const filters = parseReportFilters({
      type: 'simpanan',
      from: '2026-04-01',
      to: '2026-10-08',
      memberId: 'member-1',
      status: 'WITHDRAWAL',
      category: 'WAJIB',
    }, now)

    expect(filters.type).toBe('simpanan')
    expect(filters.from).toBe('2026-04-01')
    expect(filters.to).toBe('2026-10-08')
    expect(filters.toExclusive.toISOString()).toBe('2026-10-09T00:00:00.000Z')
    expect(filters.memberId).toBe('member-1')
    expect(filters.status).toBe('WITHDRAWAL')
    expect(filters.category).toBe('WAJIB')
    expect(filters.invalidRange).toBe(false)
  })

  it('uses the current month when dates are invalid or reversed', () => {
    const reversed = parseReportFilters({ type: 'pinjaman', from: '2026-10-09', to: '2026-10-01' }, now)
    expect(reversed.from).toBe('2026-10-01')
    expect(reversed.to).toBe('2026-10-08')
    expect(reversed.invalidRange).toBe(true)

    const invalid = parseReportFilters({ from: '2026-02-30' }, now)
    expect(invalid.from).toBe('2026-10-01')
    expect(invalid.to).toBe('2026-10-08')
    expect(invalid.invalidRange).toBe(true)
  })

  it('ignores a status value that does not belong to the selected report', () => {
    const filters = parseReportFilters({ type: 'angsuran', status: 'ACTIVE' }, now)
    expect(filters.status).toBeUndefined()
  })
})