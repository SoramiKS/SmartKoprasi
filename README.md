# SmartKoperasi

SmartKoperasi is a cooperative savings and loans management application built with Next.js App Router, TypeScript, Prisma, and PostgreSQL. The public landing page and login are Indonesian-language; protected administrator and member routes load data on the server.

## Requirements

- Node.js 20.9 or newer
- pnpm 12
- A PostgreSQL database; Neon PostgreSQL is the intended hosted provider

## Installation

```bash
pnpm install
```

On Windows PowerShell, create the local environment file with:

```powershell
Copy-Item .env.example .env
```

Set `DATABASE_URL` to the PostgreSQL connection string from Neon and `NEXTAUTH_SECRET` to a randomly generated value. For example, generate a secret with:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Keep actual credentials in `.env`; do not commit them.

## Database Setup

The initial migration creates the Prisma models, foreign keys, unique references, and query indexes. Apply it to the database in `DATABASE_URL`, then seed development data:

```bash
pnpm prisma generate
pnpm prisma migrate deploy
pnpm prisma db seed
```

The seed command is idempotent and creates records labelled `Data demonstrasi`. Demo accounts:

| Peran | Email | Kata sandi |
| --- | --- | --- |
| Pengurus | `admin@smartkoperasi.test` | `Admin123!` |
| Anggota | `rina@smartkoperasi.test` | `Anggota123!` |
| Anggota | `budi@smartkoperasi.test` | `Anggota123!` |

Use these accounts only with a development database. Change or remove them before production use.

## Run and Verify

```bash
pnpm dev
pnpm lint
pnpm test
pnpm build
pnpm start
```

## Implemented So Far

- Public landing page and credentials login using Auth.js.
- Hashed member passwords, legacy-password rehash on successful login, and database-checked admin/member route guards.
- Admin dashboard summaries using Prisma Decimal calculations.
- Member creation/editing with audit records, plus server-side search, filtering, and pagination.
- Savings transaction recording, idempotency references, audit logging, searchable/date-filtered history, and pagination.
- Installment payment recording with server-side overpayment checks, a compare-and-swap balance update, audit history, and loan completion handling.
- Member portal savings and loan views scoped to the signed-in member.
- Member cancellation requests for submitted/approved loans before activation, with admin review, request history, audit logging, and guards against concurrent approval or activation.
- Versioned loan policies, audited approvals, and atomic activation with repayment schedule generation and policy snapshots.
- Period-filtered financial recap and member/savings/loan/installment report previews with admin-only CSV export and print layout.
- Initial and loan-policy Prisma migrations, development seed, and financial/report filter unit tests.

## Known Gaps

Announcement management, dashboard activity charts, a standalone member installment page, report pagination for large datasets, and authorization/database integration tests still need implementation.

## Assumptions and Policy Decisions

- The Excel Charter and Figma files were not present in the available project/Documents files. The implementation follows the written project brief and its emerald/warm-neutral visual direction; charter-specific rules and close Figma matching remain unverified.
- Loan policies must be explicitly configured before activation. The settings support no interest or prorated flat annual interest; the first installment is due the following month on a configured day from 1 to 28, with final-installment rounding reconciliation. Confirm these rules against the Charter before operational use. Fees and penalties are not implemented, and no withdrawal restriction is applied.
- Loan cancellation is a review request, not an immediate member action; only unactivated loans without schedules can be requested for cancellation, and an admin decision is required.
- Seed loan installments are equal-principal examples solely to keep demonstration balances internally consistent; they do not define a cooperative repayment policy.
