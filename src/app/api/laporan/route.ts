import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { getReportData, parseReportFilters, serializeReportCsv } from '@/lib/report-data'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  if (user?.role !== 'ADMIN') return new Response('Forbidden', { status: 403 })

  const filters = parseReportFilters(Object.fromEntries(request.nextUrl.searchParams.entries()))
  const data = await getReportData(filters)
  const csv = `\uFEFF${serializeReportCsv(data)}`
  const fileName = `smartkoperasi-laporan-${filters.type}-${filters.from}-${filters.to}.csv`

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}