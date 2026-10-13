import { Prisma } from '@prisma/client'

type SavingsEntry = {
  type: 'DEPOSIT' | 'WITHDRAWAL'
  amount: Prisma.Decimal.Value
}

type LoanEntry = {
  status: string
  amount: Prisma.Decimal.Value
  installments: readonly { amountPaid: Prisma.Decimal.Value }[]
}

type InstallmentEntry = {
  status: string
  amountDue: Prisma.Decimal.Value
  amountPaid: Prisma.Decimal.Value
}

export function calculateSavingsBalance(transactions: readonly SavingsEntry[]) {
  return transactions.reduce((balance, transaction) => (
    transaction.type === 'DEPOSIT'
      ? balance.plus(transaction.amount)
      : balance.minus(transaction.amount)
  ), new Prisma.Decimal(0))
}

export function calculateOutstandingPrincipal(loans: readonly LoanEntry[]) {
  return loans.reduce((balance, loan) => {
    if (loan.status !== 'AKTIF') return balance

    const paid = loan.installments.reduce(
      (total, installment) => total.plus(installment.amountPaid),
      new Prisma.Decimal(0),
    )
    const remaining = new Prisma.Decimal(loan.amount).minus(paid)
    return balance.plus(remaining.greaterThan(0) ? remaining : new Prisma.Decimal(0))
  }, new Prisma.Decimal(0))
}

export function calculateInstallmentTotal(
  installments: readonly InstallmentEntry[],
  includedStatuses: readonly string[],
) {
  const statuses = new Set(includedStatuses)
  return installments.reduce((total, installment) => (
    statuses.has(installment.status)
      ? total.plus(new Prisma.Decimal(installment.amountDue).minus(installment.amountPaid))
      : total
  ), new Prisma.Decimal(0))
}

export function calculateInstallmentPayment(
  amountDue: Prisma.Decimal.Value,
  amountPaid: Prisma.Decimal.Value,
  paymentAmount: Prisma.Decimal.Value,
) {
  const remaining = new Prisma.Decimal(amountDue).minus(amountPaid)
  const payment = new Prisma.Decimal(paymentAmount)

  if (remaining.lte(0) || payment.lte(0) || payment.gt(remaining)) return null

  return {
    amountPaid: new Prisma.Decimal(amountPaid).plus(payment),
    remaining: remaining.minus(payment),
  }
}