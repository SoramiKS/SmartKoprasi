export const instant = false

import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import EditMemberForm from '@/components/forms/EditMemberForm'
import prisma from '@/lib/prisma'

export default async function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const member = await prisma.member.findUnique({ where: { id } })
  if (!member) notFound()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-sm text-slate-500">{member.memberNumber}</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-800">Ubah Data Anggota</h2>
      </div>
      <Card>
        <CardHeader><CardTitle>Informasi keanggotaan</CardTitle></CardHeader>
        <CardContent>
          <EditMemberForm member={{
            id: member.id,
            memberNumber: member.memberNumber,
            fullName: member.fullName,
            identityNumber: member.identityNumber,
            phone: member.phone,
            address: member.address,
            joinedAt: member.joinedAt.toISOString().slice(0, 10),
            status: member.status,
          }} />
        </CardContent>
      </Card>
    </div>
  )
}