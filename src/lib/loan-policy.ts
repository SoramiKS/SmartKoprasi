import { Prisma } from '@prisma/client'

export type LoanInterestMethod = 'NONE' | 'FLAT_ANNUAL'

export const MAX_POLICY_TERM_MONTHS = 600

export function buildRepaymentPlan({
  principal,
  termMonths,
  interestMethod,
  annualRatePercent,
  activatedAt,
  firstDueDay,
}: {
  principal: Prisma.Decimal.Value
  termMonths: number
  interestMethod: LoanInterestMethod
  annualRatePercent: Prisma.Decimal.Value
  activatedAt: Date
  firstDueDay: number
}) {
  if (!Number.isInteger(termMonths) || termMonths < 1 || termMonths > MAX_POLICY_TERM_MONTHS) {
    throw new RangeError('Tenor di luar rentang sistem.')
  }
  if (!Number.isInteger(firstDueDay) || firstDueDay < 1 || firstDueDay > 28) {
    throw new RangeError('Tanggal jatuh tempo harus antara tanggal 1 dan 28.')
  }

  const principalAmount = new Prisma.Decimal(principal)
  const rate = interestMethod === 'NONE' ? new Prisma.Decimal(0) : new Prisma.Decimal(annualRatePercent)
  const interestAmount = interestMethod === 'NONE'
    ? new Prisma.Decimal(0)
    : principalAmount.mul(rate).mul(termMonths).div(1200).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
  const totalRepayment = principalAmount.plus(interestAmount).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
  if (totalRepayment.greaterThan('999999999999.99')) {
    throw new RangeError('Total pembayaran melebihi kapasitas pencatatan.')
  }

  const regularInstallment = totalRepayment.div(termMonths).toDecimalPlaces(2, Prisma.Decimal.ROUND_DOWN)
  if (regularInstallment.lte(0)) {
    throw new RangeError('Nominal terlalu kecil untuk dibagi menjadi jadwal bulanan.')
  }

  const finalInstallment = totalRepayment.minus(regularInstallment.mul(termMonths - 1))
  const firstMonth = activatedAt.getUTCMonth() + 1
  const firstYear = activatedAt.getUTCFullYear()
  const installments = Array.from({ length: termMonths }, (_, index) => ({
    dueDate: new Date(Date.UTC(firstYear, firstMonth + index, firstDueDay)),
    amountDue: index === termMonths - 1 ? finalInstallment : regularInstallment,
  }))

  return { interestAmount, totalRepayment, regularInstallment, finalInstallment, installments }
}