'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { updateAnggota } from '@/app/(admin)/anggota/[id]/edit/actions'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type EditableMember = {
  id: string
  memberNumber: string
  fullName: string
  identityNumber: string
  phone: string
  address: string
  joinedAt: string
  status: 'ACTIVE' | 'INACTIVE'
}

export default function EditMemberForm({ member }: { member: EditableMember }) {
  const [state, formAction, isPending] = useActionState(updateAnggota, null)

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="memberId" value={member.id} />
      <div className="space-y-2">
        <Label htmlFor="memberNumber">Nomor Anggota</Label>
        <Input id="memberNumber" name="memberNumber" defaultValue={member.memberNumber} maxLength={40} required />
        {state?.errors?.memberNumber && <p className="text-sm text-red-600">{state.errors.memberNumber[0]}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="fullName">Nama Lengkap</Label>
        <Input id="fullName" name="fullName" defaultValue={member.fullName} required />
        {state?.errors?.fullName && <p className="text-sm text-red-600">{state.errors.fullName[0]}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="identityNumber">Nomor KTP</Label>
        <Input id="identityNumber" name="identityNumber" defaultValue={member.identityNumber} inputMode="numeric" maxLength={16} required />
        {state?.errors?.identityNumber && <p className="text-sm text-red-600">{state.errors.identityNumber[0]}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Nomor Telepon</Label>
        <Input id="phone" name="phone" defaultValue={member.phone} required />
        {state?.errors?.phone && <p className="text-sm text-red-600">{state.errors.phone[0]}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Alamat Lengkap</Label>
        <Input id="address" name="address" defaultValue={member.address} required />
        {state?.errors?.address && <p className="text-sm text-red-600">{state.errors.address[0]}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="joinedAt">Tanggal Bergabung</Label>
          <Input id="joinedAt" name="joinedAt" type="date" defaultValue={member.joinedAt} required />
          {state?.errors?.joinedAt && <p className="text-sm text-red-600">{state.errors.joinedAt[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status Anggota</Label>
          <select id="status" name="status" defaultValue={member.status} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Nonaktif</option>
          </select>
          {state?.errors?.status && <p className="text-sm text-red-600">{state.errors.status[0]}</p>}
        </div>
      </div>
      {state?.error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={isPending} className="bg-emerald-700 text-white hover:bg-emerald-800">
          {isPending ? 'Menyimpan...' : 'Simpan perubahan'}
        </Button>
        <Link href={`/anggota/${member.id}`} className={buttonVariants({ variant: 'outline' })}>Batal</Link>
      </div>
    </form>
  )
}