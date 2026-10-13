import Link from 'next/link'
import LogoutButton from '@/components/auth/LogoutButton'
import DemoDataBanner from '@/components/layout/DemoDataBanner'
import MemberMobileNav from '@/components/layout/MemberMobileNav'
import { memberNavItems } from '@/components/layout/member-nav-items'
import { requireMember } from '@/lib/session'

export const instant = false

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  await requireMember()

  return (
    <div className="flex min-h-screen min-w-0 flex-col bg-slate-50 md:flex-row">
      <aside className="hidden w-64 shrink-0 bg-slate-900 text-slate-300 md:sticky md:top-0 md:flex md:h-screen md:flex-col">
        <div className="p-6">
          <div className="text-xl font-bold text-emerald-400">SmartKoperasi</div>
          <div className="text-xs text-slate-500 mt-1">Portal Anggota</div>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {memberNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-emerald-400 transition-colors"
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <LogoutButton className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-md hover:bg-slate-800 hover:text-red-400 transition-colors" />
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b bg-white px-4 shadow-sm sm:px-6">
          <h1 className="font-semibold text-slate-800 text-lg">Portal Anggota</h1>
        </header>
        <MemberMobileNav />
        <DemoDataBanner />
        <main className="min-w-0 flex-1 overflow-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
