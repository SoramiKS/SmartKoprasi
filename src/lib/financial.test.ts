import { describe, expect, it } from 'vitest'
import { Prisma } from '@prisma/client'
import {
  calculateInstallmentTotal,
  calculateInstallmentPayment,
  calculateOutstandingPrincipal,
  calculateSavingsBalance,
} from './financial'
import { formatRupiah } from './utils'
import { canDecideLoanApplication } from './loan-workflow'

describe('financial calculations', () => {
  it('calculates savings balances without floating-point drift', () => {
    const balance = calculateSavingsBalance([
      { type: 'DEPOSIT', amount: new Prisma.Decimal('0.10') },
      { type: 'DEPOSIT', amount: new Prisma.Decimal('0.20') },
      { type: 'WITHDRAWAL', amount: new Prisma.Decimal('0.05') },
    ])

    expect(balance.toFixed(2)).toBe('0.25')
  })

  it('subtracts installment payments from active principal only', () => {
    const outstanding = calculateOutstandingPrincipal([
      {
        status: 'AKTIF',
        amount: new Prisma.Decimal('100.00'),
        installments: [{ amountPaid: new Prisma.Decimal('25.25') }],
      },
      {
        status: 'LUNAS',
        amount: new Prisma.Decimal('80.00'),
        installments: [],
      },
    ])

    expect(outstanding.toFixed(2)).toBe('74.75')
  })

  it('does not report negative principal after inconsistent overpayment data', () => {
    const outstanding = calculateOutstandingPrincipal([
      {
        status: 'AKTIF',
        amount: new Prisma.Decimal('10.00'),
        installments: [{ amountPaid: new Prisma.Decimal('12.00') }],
      },
    ])

    expect(outstanding.toFixed(2)).toBe('0.00')
  })

  it('sums only the requested installment statuses', () => {
    const total = calculateInstallmentTotal([
      { status: 'BELUM_DIBAYAR', amountDue: '150.00', amountPaid: '50.00' },
      { status: 'TERLAMBAT', amountDue: '200.00', amountPaid: '25.00' },
      { status: 'LUNAS', amountDue: '75.00', amountPaid: '75.00' },
    ], ['BELUM_DIBAYAR', 'TERLAMBAT'])

    expect(total.toFixed(2)).toBe('275.00')
  })

  it('accepts a partial installment payment and returns exact balances', () => {
    const result = calculateInstallmentPayment('100.00', '25.10', '24.90')

    expect(result?.amountPaid.toFixed(2)).toBe('50.00')
    expect(result?.remaining.toFixed(2)).toBe('50.00')
  })

  it('rejects zero, negative, and over-balance installment payments', () => {
    expect(calculateInstallmentPayment('100.00', '25.00', '0')).toBeNull()
    expect(calculateInstallmentPayment('100.00', '25.00', '-1')).toBeNull()
    expect(calculateInstallmentPayment('100.00', '25.00', '75.01')).toBeNull()
  })

  it('formats Rupiah from decimal values without converting through Number', () => {
    expect(formatRupiah(new Prisma.Decimal('1234567.5'))).toContain('1.234.568')
  })
})

describe('loan application workflow', () => {
  it('allows a decision only while a loan is awaiting review', () => {
    expect(canDecideLoanApplication('DIAJUKAN')).toBe(true)
    expect(canDecideLoanApplication('DISETUJUI')).toBe(false)
    expect(canDecideLoanApplication('DITOLAK')).toBe(false)
    expect(canDecideLoanApplication('AKTIF')).toBe(false)
    expect(canDecideLoanApplication('LUNAS')).toBe(false)
  })
})