'use client'

import { useActionState } from 'react'
import { decideLoanApplication } from '@/app/(admin)/pinjaman/actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export default function LoanDecisionForm({ loanId }: { loanId: string }) {
  const [state, formAction, isPending] = useActionState(decideLoanApplication, null)

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="loanId" value={loanId} />
      <div className="space-y-2">
        <Label htmlFor={`decision-notes-${loanId}`}>Catatan keputusan <span className="font-normal text-slate-500">(opsional)</span></Label>
        <textarea id={`decision-notes-${loanId}`} name="notes" rows={3} maxLength={1000} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      </div>
      {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" name="decision" value="DISETUJUI" disabled={isPending} className="bg-emerald-700 text-white hover:bg-emerald-800">
          {isPending ? 'Memproses...' : 'Setujui pengajuan'}
        </Button>
        <Button type="submit" name="decision" value="DITOLAK" variant="outline" disabled={isPending}>
          Tolak pengajuan
        </Button>
      </div>
    </form>
  )
}