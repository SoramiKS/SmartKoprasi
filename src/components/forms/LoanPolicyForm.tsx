'use client'

import { useActionState, type FormEvent } from 'react'
import { createLoanPolicyVersion } from '@/app/(admin)/pengaturan/pinjaman/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoanPolicyForm() {
  const [state, formAction, isPending] = useActionState(createLoanPolicyVersion, null)

  function confirmPolicyChange(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm('Terbitkan versi kebijakan pinjaman baru? Versi sebelumnya dan pinjaman yang sudah aktif tidak akan berubah.')) {
      event.preventDefault()
    }
  }

  return (
    <form action={formAction} onSubmit={confirmPolicyChange} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="policy-name">Nama kebijakan</Label>
          <Input id="policy-name" name="name" maxLength={80} required />
          {state?.errors?.name && <p className="text-sm text-red-600">{state.errors.name[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="policy-effective">Mulai berlaku</Label>
          <Input id="policy-effective" name="effectiveFrom" type="date" required />
          {state?.errors?.effectiveFrom && <p className="text-sm text-red-600">{state.errors.effectiveFrom[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="policy-method">Metode bunga</Label>
          <select id="policy-method" name="interestMethod" defaultValue="" required className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="" disabled>Pilih kebijakan</option>
            <option value="NONE">Tanpa bunga</option>
            <option value="FLAT_ANNUAL">Bunga flat tahunan</option>
          </select>
          {state?.errors?.interestMethod && <p className="text-sm text-red-600">{state.errors.interestMethod[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="policy-rate">Tarif bunga tahunan (%)</Label>
          <Input id="policy-rate" name="annualRatePercent" type="number" min="0" max="999.9999" step="0.0001" inputMode="decimal" required />
          <p className="text-xs text-slate-500">Isi 0 untuk metode tanpa bunga.</p>
          {state?.errors?.annualRatePercent && <p className="text-sm text-red-600">{state.errors.annualRatePercent[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="policy-max-term">Tenor maksimum (bulan)</Label>
          <Input id="policy-max-term" name="maximumTermMonths" type="number" min="1" max="600" step="1" inputMode="numeric" required />
          <p className="text-xs text-slate-500">Batas teknis sistem: 600 bulan.</p>
          {state?.errors?.maximumTermMonths && <p className="text-sm text-red-600">{state.errors.maximumTermMonths[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="policy-due-day">Tanggal jatuh tempo bulanan</Label>
          <Input id="policy-due-day" name="firstDueDay" type="number" min="1" max="28" step="1" inputMode="numeric" required />
          <p className="text-xs text-slate-500">Angsuran pertama jatuh tempo pada bulan kalender berikutnya.</p>
          {state?.errors?.firstDueDay && <p className="text-sm text-red-600">{state.errors.firstDueDay[0]}</p>}
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-600">
        Bunga flat dihitung prorata tenor: pokok × tarif tahunan × bulan ÷ 1.200. Nilai angsuran dibulatkan ke dua desimal; selisih pembulatan dimasukkan ke angsuran terakhir. Denda dan biaya belum diterapkan.
      </div>
      {state?.error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      <Button type="submit" disabled={isPending} className="bg-emerald-700 text-white hover:bg-emerald-800">
        {isPending ? 'Menyimpan...' : 'Terbitkan versi kebijakan'}
      </Button>
    </form>
  )
}