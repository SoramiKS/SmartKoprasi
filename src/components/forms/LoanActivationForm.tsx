'use client'

import { useActionState, type FormEvent } from 'react'
import { activateApprovedLoan } from '@/app/(admin)/pinjaman/activation-actions'
import { Button } from '@/components/ui/button'

export default function LoanActivationForm({ loanId }: { loanId: string }) {
  const [state, formAction, isPending] = useActionState(activateApprovedLoan, null)

  function confirmActivation(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm('Aktifkan pinjaman dengan kebijakan yang berlaku dan buat seluruh jadwal angsuran?')) {
      event.preventDefault()
    }
  }

  return (
    <form action={formAction} onSubmit={confirmActivation} className="space-y-3">
      <input type="hidden" name="loanId" value={loanId} />
      {state?.error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      <Button type="submit" disabled={isPending} className="bg-emerald-700 text-white hover:bg-emerald-800">
        {isPending ? 'Membuat jadwal...' : 'Aktifkan pinjaman & buat jadwal'}
      </Button>
    </form>
  )
}