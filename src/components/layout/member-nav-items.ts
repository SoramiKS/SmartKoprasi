import { LayoutDashboard, Wallet, Banknote, History, Bell, User } from 'lucide-react'

export const memberNavItems = [
  { href: '/portal', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/portal/simpanan', label: 'Simpanan', icon: Wallet },
  { href: '/portal/pinjaman', label: 'Pinjaman', icon: Banknote },
  { href: '/portal/angsuran', label: 'Angsuran', icon: History },
  { href: '/portal/pengumuman', label: 'Pengumuman', icon: Bell },
  { href: '/portal/profil', label: 'Profil', icon: User },
]