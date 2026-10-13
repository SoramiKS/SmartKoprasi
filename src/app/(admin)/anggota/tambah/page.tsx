'use client'

import { useActionState } from 'react'
import { createAnggota } from './actions'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TambahAnggotaPage() {
  const [state, formAction, isPending] = useActionState(createAnggota, null)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/anggota">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h2 className="text-2xl font-bold text-slate-800">Tambah Anggota Baru</h2>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="memberNumber">Nomor Anggota</Label>
              <Input id="memberNumber" name="memberNumber" placeholder="KOP-2026-0001" required maxLength={40} />
              {state?.errors?.memberNumber && <p className="text-sm text-red-500">{state.errors.memberNumber[0]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Nama Lengkap</Label>
              <Input id="fullName" name="fullName" required />
              {state?.errors?.fullName && <p className="text-sm text-red-500">{state.errors.fullName[0]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="identityNumber">Nomor KTP</Label>
              <Input id="identityNumber" name="identityNumber" required />
              {state?.errors?.identityNumber && <p className="text-sm text-red-500">{state.errors.identityNumber[0]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Nomor Telepon</Label>
              <Input id="phone" name="phone" required />
              {state?.errors?.phone && <p className="text-sm text-red-500">{state.errors.phone[0]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Alamat Lengkap</Label>
              <Input id="address" name="address" required />
              {state?.errors?.address && <p className="text-sm text-red-500">{state.errors.address[0]}</p>}
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-slate-800">Informasi Keanggotaan</h3>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="joinedAt">Tanggal Bergabung</Label>
                  <Input id="joinedAt" name="joinedAt" type="date" required />
                  {state?.errors?.joinedAt && <p className="text-sm text-red-500">{state.errors.joinedAt[0]}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status Anggota</Label>
                  <select id="status" name="status" defaultValue="ACTIVE" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="ACTIVE">Aktif</option>
                    <option value="INACTIVE">Nonaktif</option>
                  </select>
                  {state?.errors?.status && <p className="text-sm text-red-500">{state.errors.status[0]}</p>}
                </div>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold text-slate-800 mb-4">Informasi Akun (Untuk Login)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                  {state?.errors?.email && <p className="text-sm text-red-500">{state.errors.email[0]}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password Default</Label>
                  <Input id="password" name="password" type="password" required />
                  {state?.errors?.password && <p className="text-sm text-red-500">{state.errors.password[0]}</p>}
                </div>
              </div>
            </div>

            {state?.error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md">
                {state.error}
              </div>
            )}

            <div className="pt-4 flex gap-4">
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={isPending}>
                {isPending ? 'Menyimpan...' : 'Simpan Anggota'}
              </Button>
              <Link href="/anggota">
                <Button variant="outline" type="button">Batal</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
