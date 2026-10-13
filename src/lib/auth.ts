import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare, hash } from 'bcryptjs'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { authSecret } from '@/lib/auth-secret'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const authOptions: NextAuthOptions = {
  secret: authSecret,
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'Email dan kata sandi',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Kata sandi', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          include: { member: true },
        })
        if (!user) return null

        const isPasswordHashed = user.password.startsWith('$2')
        const isPasswordValid = isPasswordHashed
          ? await compare(parsed.data.password, user.password)
          : parsed.data.password === user.password

        if (!isPasswordValid) return null

        if (!isPasswordHashed) {
          await prisma.user.update({
            where: { id: user.id },
            data: { password: await hash(parsed.data.password, 12) },
          })
        }

        return {
          id: user.id,
          email: user.email,
          name: user.member?.fullName ?? user.email,
          role: user.role,
          memberId: user.member?.id ?? null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.memberId = user.memberId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? ''
        session.user.role = token.role ?? 'MEMBER'
        session.user.memberId = token.memberId ?? null
      }
      return session
    },
  },
}