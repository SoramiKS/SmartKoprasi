import AdminSidebar from '@/components/layout/AdminSidebar'
import AdminMobileNav from '@/components/layout/AdminMobileNav'
import DemoDataBanner from '@/components/layout/DemoDataBanner'
import { requireAdmin } from '@/lib/session'

export const instant = false

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()

  return (
    <div className="flex min-h-screen min-w-0 flex-col bg-slate-50 md:flex-row">
      <AdminSidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b bg-white px-4 shadow-sm sm:px-6 print:hidden">
          <h1 className="font-semibold text-slate-800 text-lg">Panel Pengurus</h1>
        </header>
        <AdminMobileNav />
        <DemoDataBanner />
        <main className="min-w-0 flex-1 overflow-auto p-4 sm:p-6 print:overflow-visible print:p-0">
          {children}
        </main>
      </div>
    </div>
  )
}
