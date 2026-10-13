export const instant = false;
import Link from 'next/link'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Users, Plus } from 'lucide-react'

type SearchParams = Promise<{ q?: string; status?: string; page?: string }>

export default async function AnggotaPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const search = params.q?.trim() ?? ''
  const status = params.status === 'ACTIVE' || params.status === 'INACTIVE' ? params.status : undefined
  const requestedPage = Number(params.page ?? '1')
  const safePage = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const pageSize = 20
  const where: Prisma.MemberWhereInput = {}

  if (status) where.status = status
  if (search) {
    where.OR = [
      { memberNumber: { contains: search, mode: 'insensitive' } },
      { fullName: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ]
  }

  const totalMembers = await prisma.member.count({ where })
  const pageCount = Math.max(1, Math.ceil(totalMembers / pageSize))
  const currentPage = Math.min(safePage, pageCount)
  const members = await prisma.member.findMany({
    where,
    include: { user: { select: { email: true } } },
    orderBy: [{ fullName: 'asc' }, { id: 'asc' }],
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  })
  const paginationParams = new URLSearchParams()
  if (search) paginationParams.set('q', search)
  if (status) paginationParams.set('status', status)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Manajemen Anggota</h2>
        <Link href="/anggota/tambah">
          <Button className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tambah Anggota
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Daftar Anggota
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action="/anggota" method="get" className="mb-4 flex flex-wrap items-end gap-3">
            <label className="min-w-52 flex-1 space-y-1 text-sm">
              <span className="font-medium">Cari anggota</span>
              <input name="q" defaultValue={search} placeholder="Nomor, nama, atau telepon" className="h-10 w-full rounded-md border border-input bg-background px-3" />
            </label>
            <label className="min-w-40 space-y-1 text-sm">
              <span className="font-medium">Status</span>
              <select name="status" defaultValue={status ?? ''} className="h-10 w-full rounded-md border border-input bg-background px-3">
                <option value="">Semua status</option>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Nonaktif</option>
              </select>
            </label>
            <Button type="submit" variant="outline">Terapkan</Button>
            <Link href="/anggota" className="inline-flex h-10 items-center px-2 text-sm text-slate-600 hover:text-emerald-800">Reset</Link>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">No. Anggota</th>
                  <th className="px-4 py-3 font-medium">Nama Lengkap</th>
                  <th className="px-4 py-3 font-medium">No. Telepon</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Tanggal Bergabung</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {members.length > 0 ? (
                  members.map((member) => (
                    <tr key={member.id} className="border-b hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{member.memberNumber}</td>
                      <td className="px-4 py-3">{member.fullName}</td>
                      <td className="px-4 py-3">{member.phone}</td>
                      <td className="px-4 py-3">{member.user?.email ?? '-'}</td>
                      <td className="whitespace-nowrap px-4 py-3">{member.joinedAt.toLocaleDateString('id-ID')}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          member.status === 'ACTIVE' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {member.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link href={`/anggota/${member.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>Detail</Link>
                          <Link href={`/anggota/${member.id}/edit`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>Ubah</Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      {search || status ? 'Tidak ada anggota yang sesuai dengan filter.' : 'Belum ada data anggota.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-600">
            <span>{totalMembers} anggota · Halaman {currentPage} dari {pageCount}</span>
            <div className="flex gap-2">
              {currentPage > 1 ? (
                <Link href={`/anggota?${paginationParams.toString()}${paginationParams.size ? '&' : ''}page=${currentPage - 1}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>Sebelumnya</Link>
              ) : <Button variant="outline" size="sm" disabled>Sebelumnya</Button>}
              {currentPage < pageCount ? (
                <Link href={`/anggota?${paginationParams.toString()}${paginationParams.size ? '&' : ''}page=${currentPage + 1}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>Berikutnya</Link>
              ) : <Button variant="outline" size="sm" disabled>Berikutnya</Button>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
