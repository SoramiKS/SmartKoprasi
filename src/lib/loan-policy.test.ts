import { describe, expect, it } from 'vitest'
import { Prisma } from '@prisma/client'
import { buildRepaymentPlan } from './loan-policy'

describe('loan repayment policy', () => {
  const activatedAt = new Date('2026-10-08T12:00:00.000Z')

  it('creates monthly no-interest installments and reconciles the final cent', () => {
    const plan = buildRepaymentPlan({
      principal: '1000.00',
      termMonths: 3,
      interestMethod: 'NONE',
      annualRatePercent: '0',
      activatedAt,
      firstDueDay: 15,
    })

    expect(plan.interestAmount.toFixed(2)).toBe('0.00')
    expect(plan.totalRepayment.toFixed(2)).toBe('1000.00')
    expect(plan.installments.map((item) => item.amountDue.toFixed(2))).toEqual(['333.33', '333.33', '333.34'])
    expect(plan.installments.map((item) => item.dueDate.toISOString().slice(0, 10))).toEqual([
      '2026-11-15', '2026-12-15', '2027-01-15',
    ])
  })

  it('prorates flat annual interest for the selected term', () => {
    const plan = buildRepaymentPlan({
      principal: new Prisma.Decimal('1200.00'),
      termMonths: 12,
      interestMethod: 'FLAT_ANNUAL',
      annualRatePercent: '12.0000',
      activatedAt,
      firstDueDay: 10,
    })

    expect(plan.interestAmount.toFixed(2)).toBe('144.00')
    expect(plan.totalRepayment.toFixed(2)).toBe('1344.00')
    expect(plan.installments.every((item) => item.amountDue.toFixed(2) === '112.00')).toBe(true)
  })

  it('rejects unsupported schedule sizes and zero-value monthly installments', () => {
    expect(() => buildRepaymentPlan({
      principal: '100.00',
      termMonths: 601,
      interestMethod: 'NONE',
      annualRatePercent: '0',
      activatedAt,
      firstDueDay: 1,
    })).toThrow(RangeError)

    expect(() => buildRepaymentPlan({
      principal: '0.05',
      termMonths: 12,
      interestMethod: 'NONE',
      annualRatePercent: '0',
      activatedAt,
      firstDueDay: 1,
    })).toThrow(RangeError)
  })
})