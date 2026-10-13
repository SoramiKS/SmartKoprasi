import Link from 'next/link'
import LogoutButton from '@/components/auth/LogoutButton'
import { memberNavItems } from '@/components/layout/member-nav-items'

export default function MemberMobileNav() {
  return (
    <nav aria-label="Navigasi anggota" className="flex min-w-0 items-center gap-1 overflow-x-auto border-b bg-white px-3 py-2 md:hidden">
      {memberNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-emerald-700"
        >
          <item.icon className="size-4" aria-hidden="true" />
          <span>{item.label}</span>
        </Link>
      ))}
      <LogoutButton className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-red-700" />
    </nav>
  )
}