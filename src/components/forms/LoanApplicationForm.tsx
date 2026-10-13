'use client'

import { useActionState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { submitLoanApplication } from '@/app/(member)/portal/pinjaman/actions'

export default function LoanApplicationForm({ idempotencyKey }: { idempotencyKey: string }) {
  const [state, formAction, isPending] = useActionState(submitLoanApplication, null)

  function confirmSubmission(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm('Kirim pengajuan pinjaman ini untuk ditinjau pengurus?')) event.preventDefault()
  }

  return (
    <form action={formAction} onSubmit={confirmSubmission} className="space-y-4">
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="loan-amount">Jumlah pengajuan (Rp)</Label>
          <Input id="loan-amount" name="amount" type="number" min="0.01" max="9999999999.99" step="0.01" inputMode="decimal" required />
          {state?.errors?.amount && <p className="text-sm text-red-600">{state.errors.amount[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="loan-term">Tenor (bulan)</Label>
          <Input id="loan-term" name="termMonths" type="number" min="1" step="1" inputMode="numeric" required />
          {state?.errors?.termMonths && <p className="text-sm text-red-600">{state.errors.termMonths[0]}</p>}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="loan-notes">Keterangan <span className="font-normal text-slate-500">(opsional)</span></Label>
          <textarea id="loan-notes" name="notes" rows={3} maxLength={1000} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          {state?.errors?.notes && <p className="text-sm text-red-600">{state.errors.notes[0]}</p>}
        </div>
      </div>
      {state?.error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      <Button type="submit" disabled={isPending} className="bg-emerald-700 text-white hover:bg-emerald-800">
        {isPending ? 'Mengirim...' : 'Kirim pengajuan'}
      </Button>
    </form>
  )
}