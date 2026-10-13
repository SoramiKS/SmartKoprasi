import type { DefaultSession } from 'next-auth'

type AppRole = 'ADMIN' | 'MEMBER'

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string
      role: AppRole
      memberId: string | null
    }
  }

  interface User {
    role: AppRole
    memberId: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: AppRole
    memberId?: string | null
  }
}