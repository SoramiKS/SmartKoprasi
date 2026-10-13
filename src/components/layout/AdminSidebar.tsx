import Link from 'next/link'
import { LayoutDashboard, Users, CreditCard, Banknote, History, PieChart, FileText, Settings2 } from 'lucide-react'
import LogoutButton from '@/components/auth/LogoutButton'

export const adminNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/anggota', label: 'Anggota', icon: Users },
  { href: '/transaksi', label: 'Transaksi', icon: CreditCard },
  { href: '/pinjaman', label: 'Pinjaman', icon: Banknote },
  { href: '/pengaturan/pinjaman', label: 'Kebijakan Pinjaman', icon: Settings2 },
  { href: '/angsuran', label: 'Angsuran', icon: History },
  { href: '/rekap', label: 'Rekap', icon: PieChart },
  { href: '/laporan', label: 'Laporan', icon: FileText },
]

export default function AdminSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 bg-slate-900 text-slate-300 md:sticky md:top-0 md:flex md:h-screen md:flex-col print:hidden">
      <div className="p-6">
        <div className="text-xl font-bold text-emerald-400">SmartKoperasi</div>
        <div className="text-xs text-slate-500 mt-1">Admin Panel</div>
      </div>
      <nav className="flex-1 px-4 space-y-1">
          {adminNavItems.map((item) => (
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
  )
}
