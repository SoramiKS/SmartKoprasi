export function canDecideLoanApplication(status: string) {
  return status === 'DIAJUKAN'
}

export function canRequestLoanCancellation({
  status,
  activatedAt,
  policyId,
  scheduleCount,
}: {
  status: string
  activatedAt: Date | null
  policyId: string | null
  scheduleCount: number
}) {
  return (
    (status === 'DIAJUKAN' || status === 'DISETUJUI')
    && activatedAt === null
    && policyId === null
    && scheduleCount === 0
  )
}