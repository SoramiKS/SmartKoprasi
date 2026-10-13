# Build SmartKoperasi with Next.js

Yo, I need to build a website project called **SmartKoperasi**, a digital cooperative savings and loans management system.

The **supplied Excel Charter is the primary foundation and source of truth for this project**. Use the charter to understand the project's goals, users, features, requirements, workflows, and business scope. The supplied **Figma designs should be used as the primary visual reference** for the interface.

Do not treat the Excel Charter or Figma as optional references. Before implementing the application, inspect and understand them first.

Build the application as a real, functional web application, not just a static UI mockup.

---

## 1. Product Overview

SmartKoperasi digitizes cooperative administration by bringing:

* Member management
* Savings management
* Savings transactions
* Loan applications
* Loan approvals
* Installment schedules
* Installment payments
* Financial summaries
* Reports
* Cooperative announcements

into one integrated system.

The application has two primary user roles:

### Pengurus / Admin

Can:

* Manage members
* Record and manage savings transactions
* Manage loan applications
* Approve or reject loans
* Manage installment schedules
* Record installment payments
* View financial summaries
* Generate reports
* Manage cooperative announcements
* View relevant audit records

### Anggota / Member

Can only access their own information:

* Personal profile
* Savings balance and history
* Active loans
* Installment schedule
* Installment payment history
* Cooperative announcements

Members must never be able to access another member's financial or personal records.

Use **Bahasa Indonesia** for all user-facing interface text.

Use:

* Indonesian date formatting
* Indonesian number formatting
* Indonesian Rupiah (`Rp`) formatting

---

# 2. Project Foundation

The project must be based on the supplied **Excel Charter**.

Before writing application code:

1. Inspect the Excel Charter.
2. Extract its relevant:

   * project goals
   * target users
   * features
   * requirements
   * workflows
   * business rules
   * assumptions
3. Compare the Charter with the supplied Figma designs.
4. Identify conflicts or missing requirements.
5. Resolve conflicts using this priority:

**Excel Charter → explicit project requirements → Figma visual design → reasonable implementation assumptions**

Do not invent major functionality that is not supported by the Charter or requirements.

If the Charter contains requirements that are not represented in the Figma designs, implement them where appropriate.

If the Figma contains UI elements that require functionality not specified in the Charter, document the assumption before implementing it.

At the end, provide an **Assumptions and Policy Decisions** section listing anything that still requires confirmation.

---

# 3. Landing Page

When users first open the website, they must see a **public landing page**, not the admin dashboard.

Route:

`/`

The landing page should introduce SmartKoperasi and explain its purpose.

Include:

* SmartKoperasi branding
* Short product introduction
* Main value propositions
* Overview of cooperative management features
* Simple explanation of how SmartKoperasi works
* Call-to-action buttons
* Login button
* Cooperative information section
* Footer

The landing page should follow the visual language of the supplied Figma designs while remaining appropriate as a public-facing page.

The landing page must be responsive on:

* Desktop
* Tablet
* Mobile

Unauthenticated users should only have access to public pages.

---

# 4. Authentication

Implement authentication using a **maintained authentication solution compatible with Next.js App Router**.

Required behavior:

* Login
* Logout
* Session handling
* Protected routes
* Role-based authorization
* Member-level record authorization

Suggested structure:

* `/login`
* `/logout` through the authentication flow

After login:

* Pengurus/Admin → `/dashboard`
* Anggota → `/portal`

Do not rely only on client-side checks for authorization.

Authorization must be enforced on the server.

A user must not be able to access protected records simply by changing an ID in the URL or request.

---

# 5. Technology Stack

Use the following stack:

### Frontend

* Next.js
* App Router
* TypeScript
* Tailwind CSS
* shadcn/ui
* Lucide Icons
* React Hook Form
* Zod

### Backend

Use Next.js server-side functionality.

Prefer:

* Server Components by default
* Server Actions where appropriate
* Route Handlers where appropriate

Use Client Components only when interaction requires them.

Keep database access and authorization logic on the server.

### Database

Use:

* PostgreSQL
* **Neon PostgreSQL** as the initial database provider
* Prisma ORM

The database should be configured so that the application can connect to a free Neon PostgreSQL database through environment variables.

Provide:

`.env.example`

Do not commit real credentials or secrets.

Example configuration should document the required Neon/Prisma environment variables without exposing actual credentials.

### Charts

Use:

* Recharts

for dashboard visualizations.

### Package Manager

Use **pnpm**.

README commands should use pnpm consistently.

---

# 6. Required Application Routes

Implement the following main routes.

## Public

### `/`

Landing page.

### `/login`

Authentication page.

---

# Admin / Pengurus

Admin pages should share a consistent:

* Sidebar
* Header
* Navigation
* Breadcrumb where appropriate
* User/account menu

## `/dashboard`

Admin dashboard.

Display:

* Total active members
* Total savings balance
* Outstanding loan principal
* Installments due
* Overdue installments
* Savings activity chart
* Loan activity chart
* Recent transactions
* Upcoming installments
* Overdue installments
* Quick actions

Dashboard numbers must come from real database data.

Do not hard-code financial totals.

---

## `/anggota`

Member management.

Include:

* Searchable member table
* Filtering
* Pagination
* Member status
* Member number
* Member name
* Contact information
* Member detail access
* Edit action
* Add member action
* Active/inactive status

Member data must persist to the database.

---

## `/anggota/tambah`

Add member page.

Include a validated form for:

* Member number
* Full name
* Identity information
* Contact information
* Address
* Membership information
* Status

Requirements:

* Member number must be unique
* Validate required fields
* Show validation errors clearly
* Show loading state
* Show success state
* Show error state
* Provide cancel action

---

## `/transaksi`

Savings transaction management.

Support:

* Savings deposits
* Savings withdrawals

Each transaction should contain appropriate information such as:

* Member
* Savings category
* Transaction type
* Amount
* Date
* Reference number
* Notes
* Created by

Savings categories:

* Simpanan Pokok
* Simpanan Wajib
* Simpanan Sukarela

Include:

* Search
* Filters
* Date filtering
* Transaction details
* Confirmation before submitting financial operations

Financial transactions must be persisted in PostgreSQL.

---

## `/pinjaman`

Loan management.

Include:

### Loan application form

* Member
* Loan amount
* Term
* Application date
* Notes or required information defined by the Charter

### Loan list

Include:

* Search
* Filters
* Status
* Member
* Amount
* Date
* Loan detail

Loan statuses:

* `diajukan`
* `disetujui`
* `ditolak`
* `aktif`
* `lunas`

Loan detail should show:

* Loan amount
* Term
* Repayment schedule
* Current status
* Approval history
* Relevant installment information

Do not invent interest rates, penalties, or loan policies if they are not defined by the Charter.

---

## `/angsuran`

Installment management.

Include:

* Installment schedule
* Due dates
* Amount due
* Amount paid
* Remaining balance
* Payment history
* Payment recording

Statuses:

* `belum dibayar`
* `sebagian`
* `lunas`
* `terlambat`

Prevent:

* Payments exceeding remaining balance
* Duplicate payment submissions
* Invalid payment amounts

Financial operations must use database transactions.

---

## `/rekap`

Financial summary page.

Include period-based summaries for:

* Savings
* Loans
* Installment receipts

Features:

* Date range filtering
* Period summaries
* Reconciled totals
* Summary cards
* Relevant tables

All totals must be derived from database records.

---

## `/laporan`

Reporting page.

Include reports for:

* Members
* Savings
* Loans
* Installments

Features:

* Date filtering
* Member filtering where relevant
* Status filtering where relevant
* Preview before export
* CSV export
* Print-friendly layout

CSV exports must contain actual database data rather than mock data.

---

# Member Portal

## `/portal`

Member-facing dashboard.

The signed-in member can view:

* Personal information
* Savings balance
* Savings history
* Active loans
* Loan details
* Installment schedule
* Installment payment history
* Cooperative announcements

The member must only see records belonging to their own account.

Do not expose another member's:

* savings
* loans
* installments
* personal information
* financial history

through URL parameters, API requests, Server Actions, or client-side state.

---

# 7. Data Model

Use Prisma to model at minimum:

* User
* Member
* SavingsTransaction
* Loan
* LoanApproval / LoanApprovalHistory
* InstallmentSchedule
* InstallmentPayment
* Announcement
* AuditRecord

Add supporting models where necessary.

Define proper:

* Primary keys
* Foreign keys
* Unique constraints
* Indexes
* Timestamps
* Relationships
* Enum/status values

Use Prisma migrations.

---

# 8. Financial Data Rules

These rules are critical.

## Monetary precision

Never use JavaScript floating-point arithmetic for financial calculations.

Use database decimal types and appropriate decimal handling in application logic.

Use Prisma `Decimal` where appropriate.

Display monetary values as Indonesian Rupiah.

Example:

`Rp1.500.000`

not:

`1500000`

---

## Database transactions

Financial operations must use database transactions.

For example:

Recording an installment payment should atomically:

1. Validate the installment.
2. Validate the payment amount.
3. Check the remaining balance.
4. Create the payment record.
5. Update the relevant financial state.
6. Record the audit event.

If any step fails, the entire operation should roll back.

---

## Duplicate submissions

Prevent duplicate financial submissions.

Use appropriate:

* server-side validation
* database constraints
* transaction handling
* idempotency or unique references where appropriate

Do not rely only on disabling a frontend button.

---

## Overpayment

Never allow a payment to exceed the remaining amount.

Validate this on the server.

Client-side validation is not sufficient.

---

## Financial history

Never silently delete posted financial transactions.

If a financial transaction needs to be corrected:

* Use reversal/correction records
* Preserve the original record
* Maintain an audit trail

Financial history must remain traceable.

---

# 9. Business Rules

Do not invent:

* Interest rates
* Late-payment penalties
* Withdrawal restrictions
* Loan limits
* Administrative fees
* Other financial policies

unless they are explicitly defined in the Excel Charter or project requirements.

If these policies are required but undefined:

1. Make them configurable where appropriate.
2. Document them as assumptions.
3. Clearly mark them as requiring confirmation.

---

# 10. Auditability

Important administrative and financial operations should generate audit records.

Examples:

* Member creation
* Member updates
* Savings transaction creation
* Savings reversal
* Loan submission
* Loan approval
* Loan rejection
* Installment payment
* Financial corrections

Audit records should contain appropriate information such as:

* Actor/user
* Action
* Entity
* Entity ID
* Timestamp
* Relevant metadata

Do not expose sensitive audit information to normal members.

---

# 11. Demonstration Data

Provide Prisma seed data for development and demonstration.

Seed data should include realistic examples of:

* Admin users
* Member users
* Members
* Savings transactions
* Loans
* Installment schedules
* Installment payments
* Announcements
* Audit records

All seeded financial records must be internally consistent.

For example:

* Savings balances must match savings transactions.
* Loan outstanding balances must match loan/payment records.
* Installment remaining balances must match payments.
* Dashboard totals must reconcile with the underlying data.

Clearly label seeded/demo records as:

**Data demonstrasi**

Do not present fake/demo financial data as real cooperative data.

---

# 12. UI and Visual Design

Follow the supplied Figma designs closely.

Visual direction:

* Emerald primary accents
* Warm neutral backgrounds
* Clean modern cooperative-management interface
* Clear typography
* Restrained status colors
* Clear primary actions
* Readable tables
* Consistent spacing
* Accessible forms

Admin pages should use a consistent layout.

Member pages should have clearly differentiated navigation from admin pages.

Create reusable components for:

* Sidebar
* Header
* Mobile navigation
* Breadcrumb
* Summary cards
* Data tables
* Search
* Filters
* Pagination
* Form fields
* Select inputs
* Date inputs
* Status badges
* Confirmation dialogs
* Empty states
* Loading states
* Error states
* Success notifications
* Modal/dialog components

Do not duplicate UI implementation unnecessarily between pages.

---

# 13. Responsive Design

The application must be fully responsive.

Support:

* Desktop
* Tablet
* Mobile

Pay special attention to:

* Tables
* Sidebar behavior
* Forms
* Dashboard cards
* Charts
* Navigation
* Dialogs
* Filters

On small screens, tables should remain usable through appropriate responsive behavior such as horizontal scrolling, condensed columns, or alternative card layouts.

Do not simply shrink desktop layouts until they become unusable.

---

# 14. Accessibility

Implement accessible UI.

Requirements include:

* Semantic HTML
* Proper form labels
* Keyboard navigation
* Visible focus states
* Accessible buttons
* Accessible dialogs
* Appropriate ARIA attributes when needed
* Sufficient text contrast
* Clear validation messages

Use shadcn/ui primitives where appropriate.

---

# 15. Application States

Every important page and operation should handle:

### Loading

Show appropriate loading UI.

### Empty

Explain when there is no data and provide a useful action where appropriate.

### Error

Show a clear Indonesian-language error message.

### Success

Confirm successful operations.

### Unauthorized

Prevent unauthorized access and show an appropriate response.

### Not Found

Provide an appropriate 404 experience for missing records/pages.

Do not leave users staring at blank screens.

---

# 16. Navigation

Implement fully functional navigation.

Admin navigation should include at minimum:

* Dashboard
* Anggota
* Transaksi
* Pinjaman
* Angsuran
* Rekap
* Laporan

Member navigation should include appropriate member-facing pages such as:

* Portal
* Simpanan
* Pinjaman
* Angsuran
* Pengumuman
* Profil

Navigation must respect the user's role.

Do not merely hide unauthorized links on the client. Server-side authorization must still be enforced.

---

# 17. Functional Requirements

This must be a functional application.

Do NOT create:

* Static mockups
* Fake dashboard numbers
* Non-functional buttons
* Fake forms
* Placeholder CRUD operations
* Frontend-only authorization
* Hard-coded financial data

All visible actions should either:

1. Work completely, or
2. Be clearly marked as not yet implemented.

If something cannot be implemented, document it instead of silently pretending it works.

---

# 18. Testing

Include tests for:

### Unit tests

Test:

* Financial calculations
* Balance calculations
* Remaining installment calculations
* Validation schemas
* Status transitions
* Financial edge cases

### Integration tests

Test:

* Authentication
* Role authorization
* Member record authorization
* Savings transaction recording
* Loan operations
* Installment payment recording
* Overpayment prevention

At minimum, verify that a member cannot access another member's records.

---

# 19. Database and Project Setup

Provide:

* Prisma schema
* Prisma migrations
* Prisma seed
* Neon PostgreSQL configuration
* `.env.example`
* README

The README must explain:

1. Requirements
2. Installation
3. Environment variables
4. Neon database setup
5. Prisma setup
6. Database migration
7. Database seeding
8. Development server
9. Production build
10. Test commands

Use pnpm commands consistently.

Example:

```bash
pnpm install
pnpm dev
pnpm prisma migrate dev
pnpm prisma db seed
pnpm build
pnpm test
```

Do not include real secrets in the repository.

---

# 20. Suggested Project Structure

Use a maintainable structure based on Next.js App Router.

For example:

```text
app/
├── page.tsx
├── login/
│   └── page.tsx
├── dashboard/
│   └── page.tsx
├── anggota/
│   ├── page.tsx
│   └── tambah/
│       └── page.tsx
├── transaksi/
│   └── page.tsx
├── pinjaman/
│   └── page.tsx
├── angsuran/
│   └── page.tsx
├── rekap/
│   └── page.tsx
├── laporan/
│   └── page.tsx
└── portal/
    └── page.tsx

components/
├── ui/
├── layout/
├── forms/
├── tables/
└── charts/

lib/
├── auth/
├── db/
├── validations/
├── calculations/
├── permissions/
└── utils/

prisma/
├── schema.prisma
├── migrations/
└── seed.ts
```

Adjust the structure when necessary, but keep responsibilities clearly separated.

---

# 21. Security

Treat all financial and authorization logic as server-side concerns.

Never trust:

* Client-provided user IDs
* Client-provided roles
* Client-provided member IDs
* Client-provided balances
* Client-provided authorization state

Verify everything on the server.

Prevent:

* Unauthorized record access
* IDOR vulnerabilities
* Privilege escalation
* Unauthorized financial operations
* Manipulation of financial totals

Never expose database credentials to the client.

---

# 22. Development Workflow

Before implementation:

### Step 1: Inspect the project resources

Inspect:

* Excel Charter
* Figma designs
* Existing project files, if any

### Step 2: Understand the requirements

Create a concise internal requirements map covering:

* Pages
* Roles
* Features
* Data models
* Business rules
* Workflows
* Assumptions

### Step 3: Design the architecture

Define:

* App Router structure
* Database schema
* Authentication strategy
* Authorization strategy
* Server/client boundaries
* Reusable components
* Validation strategy

### Step 4: Implement the foundation

Implement:

* Next.js setup
* Tailwind
* shadcn/ui
* Prisma
* Neon connection
* Authentication
* Database schema
* Migrations
* Seed data

### Step 5: Implement the public experience

Build:

* Landing page
* Login

### Step 6: Implement admin experience

Build:

* Dashboard
* Anggota
* Tambah Anggota
* Transaksi
* Pinjaman
* Angsuran
* Rekap
* Laporan

### Step 7: Implement member portal

Build:

* Portal dashboard
* Member-specific data
* Announcements
* Savings
* Loans
* Installments

### Step 8: Implement business logic

Verify:

* Financial calculations
* Database transactions
* Authorization
* Duplicate prevention
* Overpayment prevention
* Audit records

### Step 9: Testing and validation

Test:

* Authentication
* Authorization
* CRUD
* Financial calculations
* Responsive UI
* Empty/loading/error states

### Step 10: Documentation

Update:

* README
* `.env.example`
* Assumptions
* Policy decisions
* Known limitations

---

# 23. Important Implementation Rules

Do not rush directly into writing UI code.

First understand the supplied Excel Charter and Figma designs.

Do not replace project requirements with your own assumptions.

Do not create unnecessary features simply because they are common in cooperative management systems.

Do not hard-code financial data.

Do not use floating-point numbers for monetary calculations.

Do not implement authorization only on the frontend.

Do not silently delete financial history.

Do not leave important buttons as placeholders.

Do not stop after creating static pages.

The final result should be a **functional SmartKoperasi web application backed by Neon PostgreSQL**, with authentication, role-based authorization, persistent database operations, financial business rules, responsive UI, and a public landing page.

---

# 24. Final Deliverables

The completed project should contain:

* Functional SmartKoperasi website
* Public landing page
* Login/authentication
* Admin dashboard
* Member management
* Savings transactions
* Loan management
* Installment management
* Financial summaries
* Reports
* Member portal
* Announcements
* Role-based authorization
* Record-level authorization
* PostgreSQL/Neon database
* Prisma schema and migrations
* Demonstration seed data
* Financial calculations
* Audit records
* Responsive UI
* Accessible components
* Unit tests
* Integration tests
* `.env.example`
* README
* Assumptions and policy documentation

Before considering the project complete, verify that navigation, authentication, CRUD operations, financial calculations, authorization, and database persistence actually work.

Clearly identify anything that remains unimplemented.

**Start by inspecting the supplied Excel Charter and Figma designs, then present the architecture, data model, routes, assumptions, and implementation plan before writing the application code.**
