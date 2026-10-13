import { describe, expect, it } from 'vitest'
import { canRequestLoanCancellation } from './loan-workflow'

describe('loan cancellation eligibility', () => {
  it('allows requests for submitted or approved loans before activation', () => {
    for (const status of ['DIAJUKAN', 'DISETUJUI']) {
      expect(canRequestLoanCancellation({
        status,
        activatedAt: null,
        policyId: null,
        scheduleCount: 0,
      })).toBe(true)
    }
  })

  it('blocks requests after activation, schedule creation, or a terminal status', () => {
    expect(canRequestLoanCancellation({ status: 'AKTIF', activatedAt: new Date(), policyId: 'policy-1', scheduleCount: 1 })).toBe(false)
    expect(canRequestLoanCancellation({ status: 'DISETUJUI', activatedAt: null, policyId: null, scheduleCount: 1 })).toBe(false)
    expect(canRequestLoanCancellation({ status: 'DISETUJUI', activatedAt: new Date(), policyId: null, scheduleCount: 0 })).toBe(false)
    expect(canRequestLoanCancellation({ status: 'DITOLAK', activatedAt: null, policyId: null, scheduleCount: 0 })).toBe(false)
    expect(canRequestLoanCancellation({ status: 'DIBATALKAN', activatedAt: null, policyId: null, scheduleCount: 0 })).toBe(false)
  })
})