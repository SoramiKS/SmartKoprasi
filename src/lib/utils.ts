import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Prisma } from "@prisma/client"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(amount: Prisma.Decimal.Value) {
  const roundedAmount = new Prisma.Decimal(amount)
    .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP)
    .toFixed(0)

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(BigInt(roundedAmount))
}
