import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { authSecret } from '@/lib/auth-secret'

const protectedAdminRoutes = ['/dashboard', '/anggota', '/transaksi', '/pinjaman', '/pengaturan', '/angsuran', '/rekap', '/laporan']
const protectedMemberRoutes = ['/portal']

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isProtectedAdmin = protectedAdminRoutes.some(route => path.startsWith(route))
  const isProtectedMember = protectedMemberRoutes.some(route => path.startsWith(route))

  if (isProtectedAdmin || isProtectedMember) {
    if (!authSecret && process.env.NODE_ENV === 'development') {
      return NextResponse.next()
    }

    const session = await getToken({ req, secret: authSecret })

    if (!session?.sub) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    if (isProtectedAdmin && session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/portal', req.url))
    }

    if (isProtectedMember && session.role !== 'MEMBER') {
      if (session.role === 'ADMIN') return NextResponse.redirect(new URL('/dashboard', req.url))
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
