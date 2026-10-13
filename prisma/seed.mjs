import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

function dateAtMonthOffset(offset) {
  const date = new Date()
  date.setUTCDate(15)
  date.setUTCHours(0, 0, 0, 0)
  date.setUTCMonth(date.getUTCMonth() + offset)
  return date
}

async function main() {
  const adminPassword = await hash('Admin123!', 12)
  const memberPassword = await hash('Anggota123!', 12)
  const today = dateAtMonthOffset(0)

  await prisma.$transaction(async (tx) => {
    const admin = await tx.user.upsert({
      where: { email: 'admin@smartkoperasi.test' },
      update: { password: adminPassword, role: 'ADMIN' },
      create: { email: 'admin@smartkoperasi.test', password: adminPassword, role: 'ADMIN' },
    })
    const memberUserOne = await tx.user.upsert({
      where: { email: 'rina@smartkoperasi.test' },
      update: { password: memberPassword, role: 'MEMBER' },
      create: { email: 'rina@smartkoperasi.test', password: memberPassword, role: 'MEMBER' },
    })
    const memberUserTwo = await tx.user.upsert({
      where: { email: 'budi@smartkoperasi.test' },
      update: { password: memberPassword, role: 'MEMBER' },
      create: { email: 'budi@smartkoperasi.test', password: memberPassword, role: 'MEMBER' },
    })

    const rina = await tx.member.upsert({
      where: { memberNumber: 'DEMO-2026-0001' },
      update: {
        userId: memberUserOne.id,
        fullName: 'Rina Maharani',
        identityNumber: '3273015501900001',
        phone: '081234560001',
        address: 'Bandung, Jawa Barat',
        status: 'ACTIVE',
      },
      create: {
        userId: memberUserOne.id,
        memberNumber: 'DEMO-2026-0001',
        fullName: 'Rina Maharani',
        identityNumber: '3273015501900001',
        phone: '081234560001',
        address: 'Bandung, Jawa Barat',
        status: 'ACTIVE',
      },
    })
    const budi = await tx.member.upsert({
      where: { memberNumber: 'DEMO-2026-0002' },
      update: {
        userId: memberUserTwo.id,
        fullName: 'Budi Santoso',
        identityNumber: '3273011502850002',
        phone: '081234560002',
        address: 'Cimahi, Jawa Barat',
        status: 'ACTIVE',
      },
      create: {
        userId: memberUserTwo.id,
        memberNumber: 'DEMO-2026-0002',
        fullName: 'Budi Santoso',
        identityNumber: '3273011502850002',
        phone: '081234560002',
        address: 'Cimahi, Jawa Barat',
        status: 'ACTIVE',
      },
    })

    const savingsRecords = [
      { referenceNumber: 'DEMO-SAV-001', memberId: rina.id, category: 'POKOK', amount: '500000.00', month: -5 },
      { referenceNumber: 'DEMO-SAV-002', memberId: rina.id, category: 'WAJIB', amount: '600000.00', month: -3 },
      { referenceNumber: 'DEMO-SAV-003', memberId: rina.id, category: 'SUKARELA', amount: '400000.00', month: -1 },
      { referenceNumber: 'DEMO-SAV-004', memberId: budi.id, category: 'POKOK', amount: '500000.00', month: -4 },
      { referenceNumber: 'DEMO-SAV-005', memberId: budi.id, category: 'WAJIB', amount: '250000.00', month: -1 },
    ]

    for (const record of savingsRecords) {
      const { month, ...data } = record
      await tx.savingsTransaction.upsert({
        where: { referenceNumber: record.referenceNumber },
        update: {
          memberId: data.memberId,
          category: data.category,
          type: 'DEPOSIT',
          amount: data.amount,
          date: dateAtMonthOffset(month),
          notes: 'Data demonstrasi',
          createdBy: admin.id,
        },
        create: {
          ...data,
          type: 'DEPOSIT',
          date: dateAtMonthOffset(month),
          notes: 'Data demonstrasi',
          createdBy: admin.id,
        },
      })
    }

    const activeLoan = await tx.loan.upsert({
      where: { id: 'demo-loan-active' },
      update: {
        memberId: rina.id,
        amount: '1200000.00',
        termMonths: 6,
        applicationDate: dateAtMonthOffset(-6),
        notes: 'Data demonstrasi',
        status: 'AKTIF',
      },
      create: {
        id: 'demo-loan-active',
        memberId: rina.id,
        amount: '1200000.00',
        termMonths: 6,
        applicationDate: dateAtMonthOffset(-6),
        notes: 'Data demonstrasi',
        status: 'AKTIF',
      },
    })
    const pendingLoan = await tx.loan.upsert({
      where: { id: 'demo-loan-pending' },
      update: {
        memberId: budi.id,
        amount: '3000000.00',
        termMonths: 12,
        applicationDate: today,
        notes: 'Data demonstrasi',
        status: 'DIAJUKAN',
      },
      create: {
        id: 'demo-loan-pending',
        memberId: budi.id,
        amount: '3000000.00',
        termMonths: 12,
        applicationDate: today,
        notes: 'Data demonstrasi',
        status: 'DIAJUKAN',
      },
    })

    for (const approval of [
      { id: 'demo-approval-active', loanId: activeLoan.id, status: 'AKTIF', notes: 'Data demonstrasi' },
      { id: 'demo-approval-pending', loanId: pendingLoan.id, status: 'DIAJUKAN', notes: 'Data demonstrasi' },
    ]) {
      await tx.loanApprovalHistory.upsert({
        where: { id: approval.id },
        update: { ...approval, createdBy: admin.id },
        create: { ...approval, createdBy: admin.id },
      })
    }

    for (let index = 0; index < 6; index += 1) {
      const scheduleNumber = String(index + 1).padStart(2, '0')
      const amountPaid = index === 0 ? '200000.00' : index === 1 ? '50000.00' : '0.00'
      const status = index === 0 ? 'LUNAS' : index === 1 ? 'TERLAMBAT' : 'BELUM_DIBAYAR'
      const schedule = {
        id: `demo-schedule-${scheduleNumber}`,
        loanId: activeLoan.id,
        dueDate: dateAtMonthOffset(index - 2),
        amountDue: '200000.00',
        amountPaid,
        status,
      }
      await tx.installmentSchedule.upsert({
        where: { id: schedule.id },
        update: schedule,
        create: schedule,
      })
    }

    const payments = [
      { id: 'demo-payment-001', scheduleId: 'demo-schedule-01', referenceNumber: 'DEMO-PAY-001', amount: '200000.00', month: -2 },
      { id: 'demo-payment-002', scheduleId: 'demo-schedule-02', referenceNumber: 'DEMO-PAY-002', amount: '50000.00', month: -1 },
    ]
    for (const payment of payments) {
      await tx.installmentPayment.upsert({
        where: { referenceNumber: payment.referenceNumber },
        update: {
          installmentScheduleId: payment.scheduleId,
          amount: payment.amount,
          date: dateAtMonthOffset(payment.month),
          notes: 'Data demonstrasi',
          createdBy: admin.id,
        },
        create: {
          id: payment.id,
          installmentScheduleId: payment.scheduleId,
          amount: payment.amount,
          date: dateAtMonthOffset(payment.month),
          referenceNumber: payment.referenceNumber,
          notes: 'Data demonstrasi',
          createdBy: admin.id,
        },
      })
    }

    for (const announcement of [
      { id: 'demo-announcement-001', title: 'Data demonstrasi: Jadwal layanan', content: 'Informasi ini adalah contoh pengumuman untuk keperluan demonstrasi SmartKoperasi.' },
      { id: 'demo-announcement-002', title: 'Data demonstrasi: Informasi anggota', content: 'Pengurus dapat menyampaikan informasi koperasi melalui portal anggota.' },
    ]) {
      await tx.announcement.upsert({
        where: { id: announcement.id },
        update: { ...announcement, authorId: admin.id },
        create: { ...announcement, authorId: admin.id },
      })
    }

    await tx.auditRecord.upsert({
      where: { id: 'demo-audit-seed' },
      update: {
        userId: admin.id,
        action: 'SEED_DEMO_DATA',
        entity: 'DemoDataset',
        entityId: 'smartkoperasi-demo',
        details: JSON.stringify({ label: 'Data demonstrasi' }),
      },
      create: {
        id: 'demo-audit-seed',
        userId: admin.id,
        action: 'SEED_DEMO_DATA',
        entity: 'DemoDataset',
        entityId: 'smartkoperasi-demo',
        details: JSON.stringify({ label: 'Data demonstrasi' }),
      },
    })
  })

  console.log('Data demonstrasi SmartKoperasi berhasil disiapkan.')
}

main()
  .catch((error) => {
    console.error('Gagal menyiapkan data demonstrasi.', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
