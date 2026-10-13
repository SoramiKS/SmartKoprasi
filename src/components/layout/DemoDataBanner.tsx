import prisma from '@/lib/prisma'

export default async function DemoDataBanner() {
  const marker = await prisma.auditRecord.findUnique({
    where: { id: 'demo-audit-seed' },
    select: { id: true },
  })

  if (!marker) return null

  return (
    <p role="status" className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-sm text-amber-900">
      Data demonstrasi: informasi keuangan ini bukan catatan koperasi sebenarnya.
    </p>
  )
}