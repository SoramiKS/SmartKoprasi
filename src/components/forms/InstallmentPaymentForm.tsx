'use client'

import { useActionState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { recordInstallmentPayment } from '@/app/(admin)/angsuran/actions'

export default function InstallmentPaymentForm({
  scheduleId,
  remaining,
  paymentKey,
  today,
}: {
  scheduleId: string
  remaining: string
  paymentKey: string
  today: string
}) {
  const [state, formAction, isPending] = useActionState(recordInstallmentPayment, null)

  function confirmPayment(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm('Catat pembayaran angsuran ini?')) event.preventDefault()
  }

  return (
    <form action={formAction} onSubmit={confirmPayment} className="mt-3 grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="scheduleId" value={scheduleId} />
      <input type="hidden" name="idempotencyKey" value={paymentKey} />
      <div className="space-y-1">
        <Label htmlFor={`amount-${scheduleId}`}>Nominal pembayaran (Rp)</Label>
        <Input id={`amount-${scheduleId}`} name="amount" type="number" min="0.01" max={remaining} step="0.01" inputMode="decimal" required />
        {state?.errors?.amount && <p className="text-sm text-red-600">{state.errors.amount[0]}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor={`date-${scheduleId}`}>Tanggal pembayaran</Label>
        <Input id={`date-${scheduleId}`} name="date" type="date" defaultValue={today} required />
        {state?.errors?.date && <p className="text-sm text-red-600">{state.errors.date[0]}</p>}
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor={`notes-${scheduleId}`}>Catatan <span className="font-normal text-slate-500">(opsional)</span></Label>
        <Input id={`notes-${scheduleId}`} name="notes" maxLength={500} />
      </div>
      {state?.error && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{state.error}</p>}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={isPending} size="sm" className="bg-emerald-700 text-white hover:bg-emerald-800">
          {isPending ? 'Menyimpan...' : 'Catat pembayaran'}
        </Button>
      </div>
    </form>
  )
}