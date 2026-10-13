'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export default function LogoutButton({ className }: { className: string }) {
  return (
    <button type="button" onClick={() => signOut({ callbackUrl: '/login' })} className={className}>
      <LogOut className="w-5 h-5" aria-hidden="true" />
      <span>Keluar</span>
    </button>
  )
}