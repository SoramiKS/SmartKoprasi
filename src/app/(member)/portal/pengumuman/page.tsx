export const instant = false

import { Bell } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import prisma from '@/lib/prisma'
import { requireMember } from '@/lib/session'

export default async function MemberAnnouncementsPage() {
  await requireMember()
  const announcements = await prisma.announcement.findMany({
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  })

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Pengumuman</h2>
        <p className="mt-1 text-sm text-slate-500">Informasi terbaru dari koperasi untuk seluruh anggota.</p>
      </div>

      {announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardHeader className="gap-2">
                <CardTitle>{announcement.title}</CardTitle>
                <p className="text-xs text-slate-500">
                  {announcement.createdAt.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{announcement.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Bell className="size-8 text-slate-300" aria-hidden="true" />
            <p className="mt-3 font-medium text-slate-700">Belum ada pengumuman</p>
            <p className="mt-1 text-sm text-slate-500">Pengumuman koperasi akan muncul di halaman ini.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
