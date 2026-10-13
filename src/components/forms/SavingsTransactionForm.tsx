'use client'

import { useActionState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSavingsTransaction } from '@/app/(admin)/transaksi/actions'

type MemberOption = {
  id: string
  memberNumber: string
  fullName: string
}

export default function SavingsTransactionForm({
  members,
  transactionKey,
  today,
}: {
  members: MemberOption[]
  transactionKey: string
  today: string
}) {
  const [state, formAction, isPending] = useActionState(createSavingsTransaction, null)

  function confirmTransaction(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm('Simpan transaksi simpanan ini? Transaksi yang sudah dicatat tidak dapat dihapus.')) {
      event.preventDefault()
    }
  }

  return (
    <form action={formAction} onSubmit={confirmTransaction} className="space-y-4">
      <input type="hidden" name="idempotencyKey" value={transactionKey} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="memberId">Anggota</Label>
          <select id="memberId" name="memberId" required defaultValue="" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="" disabled>Pilih anggota</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>{member.memberNumber} · {member.fullName}</option>
            ))}
          </select>
          {state?.errors?.memberId && <p className="text-sm text-red-600">{state.errors.memberId[0]}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Jenis simpanan</Label>
          <select id="category" name="category" required defaultValue="WAJIB" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="POKOK">Simpanan Pokok</option>
            <option value="WAJIB">Simpanan Wajib</option>
            <option value="SUKARELA">Simpanan Sukarela</option>
          </select>
          {state?.errors?.category && <p className="text-sm text-red-600">{state.errors.category[0]}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Jenis transaksi</Label>
          <select id="type" name="type" required defaultValue="DEPOSIT" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="DEPOSIT">Setoran</option>
            <option value="WITHDRAWAL">Penarikan</option>
          </select>
          {state?.errors?.type && <p className="text-sm text-red-600">{state.errors.type[0]}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Nominal (Rp)</Label>
          <Input id="amount" name="amount" type="number" min="0.01" step="0.01" inputMode="decimal" required />
          {state?.errors?.amount && <p className="text-sm text-red-600">{state.errors.amount[0]}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Tanggal transaksi</Label>
          <Input id="date" name="date" type="date" defaultValue={today} required />
          {state?.errors?.date && <p className="text-sm text-red-600">{state.errors.date[0]}</p>}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Catatan <span className="font-normal text-slate-500">(opsional)</span></Label>
          <textarea id="notes" name="notes" rows={3} maxLength={500} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          {state?.errors?.notes && <p className="text-sm text-red-600">{state.errors.notes[0]}</p>}
        </div>
      </div>

      {members.length === 0 && <p className="text-sm text-amber-800">Tambahkan anggota terlebih dahulu untuk mencatat transaksi.</p>}
      {state?.error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}

      <Button type="submit" disabled={isPending || members.length === 0} className="bg-emerald-700 text-white hover:bg-emerald-800">
        {isPending ? 'Menyimpan...' : 'Catat transaksi'}
      </Button>
    </form>
  )
}