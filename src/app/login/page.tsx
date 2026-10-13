'use client'

import { useState, type FormEvent } from 'react'
import { getSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsPending(true)

    const formData = new FormData(event.currentTarget)
    try {
      const result = await signIn('credentials', {
        email: formData.get('email'),
        password: formData.get('password'),
        redirect: false,
      })

      if (!result?.ok || result.error) {
        setError('Email atau kata sandi salah')
        return
      }

      const session = await getSession()
      router.replace(session?.user.role === 'ADMIN' ? '/dashboard' : '/portal')
      router.refresh()
    } catch {
      setError('Tidak dapat masuk saat ini. Silakan coba lagi.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block font-bold text-2xl text-emerald-700 mb-2">
            SmartKoperasi
          </Link>
          <h2 className="text-xl font-semibold text-slate-800">Masuk ke Akun Anda</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="nama@email.com" 
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              name="password" 
              type="password" 
              required 
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isPending}>
            {isPending ? 'Memproses...' : 'Masuk'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          <p>Data demonstrasi · Pengurus: admin@smartkoperasi.test / Admin123!</p>
          <p>Anggota: rina@smartkoperasi.test / Anggota123!</p>
        </div>
      </div>
    </div>
  )
}
