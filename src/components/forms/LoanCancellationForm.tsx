'use client'

import { useActionState, type FormEvent } from 'react'
import { requestLoanCancellation } from '@/app/(member)/portal/pinjaman/actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export default function LoanCancellationForm({ loanId }: { loanId: string }) {
  const [state, formAction, isPending] = useActionState(requestLoanCancellation, null)

  function confirmRequest(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm('Kirim permintaan pembatalan ini kepada pengurus untuk ditinjau?')) {
      event.preventDefault()
    }
  }

  return (
    <form action={formAction} onSubmit={confirmRequest} className="mt-3 space-y-3 rounded-md border border-red-100 bg-red-50/50 p-3">
      <input type="hidden" name="loanId" value={loanId} />
      <div className="space-y-2">
        <Label htmlFor={`cancellation-reason-${loanId}`}>Alasan pembatalan</Label>
        <textarea id={`cancellation-reason-${loanId}`} name="reason" rows={3} minLength={10} maxLength={1000} required className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        {state?.errors?.reason && <p className="text-sm text-red-600">{state.errors.reason[0]}</p>}
      </div>
      {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      <Button type="submit" variant="destructive" disabled={isPending} size="sm">
        {isPending ? 'Mengirim permintaan...' : 'Ajukan pembatalan'}
      </Button>
    </form>
  )
}