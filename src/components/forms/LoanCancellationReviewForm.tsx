'use client'

import { useActionState, type FormEvent } from 'react'
import { reviewLoanCancellationRequest } from '@/app/(admin)/pinjaman/actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export default function LoanCancellationReviewForm({ requestId }: { requestId: string }) {
  const [state, formAction, isPending] = useActionState(reviewLoanCancellationRequest, null)

  function confirmReview(event: FormEvent<HTMLFormElement>) {
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    const decision = submitter?.value === 'DISETUJUI' ? 'menyetujui' : 'menolak'
    if (!window.confirm(`Yakin ${decision} permintaan pembatalan pinjaman ini?`)) event.preventDefault()
  }

  return (
    <form action={formAction} onSubmit={confirmReview} className="space-y-3">
      <input type="hidden" name="requestId" value={requestId} />
      <div className="space-y-2">
        <Label htmlFor={`cancellation-review-${requestId}`}>Catatan pengurus <span className="font-normal text-slate-500">(opsional)</span></Label>
        <textarea id={`cancellation-review-${requestId}`} name="notes" rows={2} maxLength={1000} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      </div>
      {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" name="decision" value="DISETUJUI" disabled={isPending} className="bg-red-700 text-white hover:bg-red-800">
          {isPending ? 'Memproses...' : 'Setujui pembatalan'}
        </Button>
        <Button type="submit" name="decision" value="DITOLAK" variant="outline" disabled={isPending}>
          Tolak pembatalan
        </Button>
      </div>
    </form>
  )
}