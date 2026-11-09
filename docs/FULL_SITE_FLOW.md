# BuildPro — Full site flow (frontend and backend)

How the website works end to end: who uses which screens, what the server does, and how data moves.

BuildPro is one Next.js app with **four surfaces**:

| Surface | Who | URL prefix | Purpose |
|---------|-----|------------|---------|
| Public site | Anyone | `/`, `/services` | Marketing, search trades, sign up |
| Customer portal | Homeowner (`CLIENT`) | `/customer/*` | Post jobs, hire traders, message |
| Contractor portal | Trader (`CONTRACTOR`) | `/construction/*` | Services, quotes, credits, commission |
| Staff dashboard | Admin and site staff | `/dashboard`, `/projects`, … | Projects, finance, users, pricing, disputes |

There are **two customer–trader ways of working**. They share users and notifications, and they do not share payment.

1. **Marketplace jobs** — post a job, match traders, quote (credits/subscribe), accept → trader pays commission → invoice. Customer pays the trader off-platform.
2. **Service requests** — browse a trader’s listed service, send a request, chat. Status only. No platform payment.

Staff also run an internal **construction management** system (projects, tasks, materials, invoices). That is separate from marketplace jobs.

---

## 1. How a click becomes data

```
Browser
  │
  ├─ Page (React server component) ── reads Prisma directly
  ├─ Form / button ── server action in src/actions/*
  └─ fetch / Stripe ── route handler in src/app/api/*
           │
           ▼
     auth() / requireAuth()     session JWT, role check
           │
           ▼
     Prisma  →  MongoDB
           │
           ├─ Notification row
           ├─ Email (SMTP template)
           ├─ Stripe (PaymentIntent, Connect, refund, transfer)
           └─ AuditLog
           │
           ▼
     revalidatePath()  →  next page render shows new data
```

**Stack**

| Layer | What it is |
|-------|------------|
| UI | Next.js App Router, React, Tailwind |
| Auth | NextAuth credentials, JWT session, refresh tokens in MongoDB |
| Data | Prisma + MongoDB (`prisma/schema.prisma`) |
| Money | Stripe Checkout-style PaymentIntent, Connect, webhooks |
| Mail | Admin SMTP settings + email templates |

**Route groups** (folders in parentheses do not appear in the URL):

| Folder | URLs |
|--------|------|
| `src/app/page.tsx`, `src/app/services` | Public |
| `src/app/(auth)` | `/login`, `/register`, password reset |
| `src/app/(customer-portal)` | `/customer/login`, `/customer/register` |
| `src/app/(customer-area)` | Logged-in customer |
| `src/app/(construction-portal)` | `/construction/login`, `/construction/register` |
| `src/app/(contractor-area)` | Logged-in contractor |
| `src/app/(dashboard)` | Staff |

**Guard rails**

- `middleware.ts` + `auth.config.ts` run on every page. Logged-out users go to `/login`. A `CLIENT` cannot open staff or contractor pages. A `CONTRACTOR` cannot open customer or staff pages. Staff cannot open customer or contractor areas. `/admin` needs role `ADMIN` or higher.
- Server actions call `requireAuth(roles)` again. The page guard is not the only check.
- After login, home is chosen in `src/lib/role-home.ts`: customer → `/customer/dashboard`, contractor → `/construction/dashboard`, everyone else → `/dashboard`.

---

## 2. Roles

| Role | Portal | Created by |
|------|--------|------------|
| `CLIENT` | Customer | `/customer/register` or `/register` |
| `CONTRACTOR` | Contractor | `/construction/register` |
| `SUPER_ADMIN`, `ADMIN` | Staff | Seed or Users screen |
| `PROJECT_MANAGER`, `SITE_ENGINEER`, `FOREMAN`, `ACCOUNTANT`, `VIEWER` | Staff | Users screen, optional custom `StaffRole` |

A **trader is verified** only when all three are true on the `User` row: Stripe Connect onboarding done, payouts enabled, and a fee card saved (`feePaymentMethodId`). Matching prefers verified traders. Quoting requires verification.

---

## 3. Public site

```
/                         Landing (hero search, how it works, trades)
  ├─ Find a Trader  →  /services          public service catalog
  ├─ Post a Job     →  /customer/register  (then login → post job)
  ├─ Log In         →  /login
  └─ Sign Up        →  /customer/register
```

`/services` lists active contractor `Service` records. Requesting one requires a customer login; the form posts `requestServiceAction`.

`/construction/login` and `/customer/login` redirect into the shared `/login`. Register pages stay separate so the correct role is created.

---

## 4. Auth flow

```
Register                         Login                         Session
────────                         ─────                         ───────
Customer form                    email + password              JWT in cookie
  registerAction                   loginAction                   access token ~short
  bcrypt hash                      NextAuth Credentials          refresh token in DB
  User.role = CLIENT               compare hash                  jwt callback refreshes
  welcome email                    reject if !isActive           sign-out revokes refresh tokens
  notify admins                    redirect ROLE_HOME

Contractor form
  contractorRegisterAction
  User.role = CONTRACTOR
  name stored as "Name — Company"
```

| Step | Page | Backend |
|------|------|---------|
| Customer sign up | `/customer/register` | `src/actions/auth/register.ts` |
| Contractor sign up | `/construction/register` | `src/actions/auth/contractor-register.ts` |
| Sign in | `/login` | `src/actions/auth/login.ts` → `auth.ts` |
| Forgot password | `/forgot-password` | `forgotPasswordAction` writes `PasswordResetToken`, emails link |
| Reset password | `/reset-password` | `resetPasswordAction` |
| Verify email | `/verify-email` | `verifyEmailAction` |
| Sign out | header | `logoutAction` → revoke refresh tokens |

Passwords are bcrypt hashes. Sessions are JWT, not database sessions. A dead refresh token sends the user to `/login?error=SessionExpired`.

---

## 5. Marketplace jobs (credits + commission)

Six-step money path (GBP only). Customer pays the trader **off-platform**. BuildPro charges traders for quoting (credits or subscription) and for wins (commission + invoice).

### Screens

| Step | Customer UI | Contractor UI | Staff UI |
|------|-------------|---------------|----------|
| Setup | — | Services + `/construction/billing` (credits/plans). Optional `/construction/payouts` | Pricing `/settings/pricing` |
| Post | `/customer/jobs/new` | — | — |
| Match | Job detail shows invites | `/construction/invitations` | — |
| Quote | Quotes on job detail | Invitation detail (needs credits or subscription) | — |
| Accept | Accept panel → job `AWARDED` | Pay commission on `/construction/jobs/[id]` | — |
| Work | Status on job detail | Start (after commission paid) / Complete | — |
| Close | Confirm completion | Invoices on `/construction/billing` | `/disputes` |

### Sequence

```mermaid
sequenceDiagram
  participant C as Customer browser
  participant S as Server actions
  participant DB as MongoDB
  participant T as Contractor browser
  participant ST as Stripe

  C->>S: createJobAction
  S->>DB: MarketplaceJob OPEN
  S->>DB: JobInvitation x up to 3
  S-->>T: notification

  T->>S: buyCredits / subscribe (optional)
  T->>ST: PaymentIntent (credits or subscription)
  ST->>S: webhook → credits / subscriptionEndsAt

  T->>S: submitQuoteAction (1 credit or free if subscribed)
  S->>DB: Quote SUBMITTED, job QUOTES_RECEIVED

  C->>S: acceptQuoteAction
  S->>DB: quote ACCEPTED, FeeLedger PENDING, PlatformInvoice ISSUED, job AWARDED

  T->>S: createCommissionCheckoutAction
  T->>ST: PaymentIntent (commission)
  ST->>S: webhook → fee COLLECTED, invoice PAID

  T->>S: startJobAction → IN_PROGRESS
  T->>S: completeJobAction → COMPLETED
  C->>S: confirmJobAction → PAID_OUT (no escrow transfer)
```

### Backend, step by step

**1. Customer posts a job** — `createJobAction` (`src/actions/marketplace/jobs.ts`)

- Role must be `CLIENT`.
- Validates title, description, category, optional location, budget, up to 8 photo URLs.
- Inserts `MarketplaceJob` with status `OPEN`.
- Writes an `AuditLog`.
- Calls `inviteTradersToJob` (`src/lib/matching.ts`).

**2. Matching**

- Loads active contractors who have at least one active service.
- Score: verified +100, exact category +40, soft category +15, request volume, location text match, minus recent invites (fairness).
- Fills up to `matchingInviteCount` (default **3**) live invites (`SENT` or `VIEWED`).
- Each invite expires after `invitationExpiryHours` (default **48**).
- Notifies each trader with a link to `/construction/invitations/[id]`.
- If a trader declines, or an invite expires, `maintainLiveInvitations` tops the list back up until `maxReassignments` (default **6**).

**3. Contractor access** — `/construction/billing` + `src/actions/marketplace/billing.ts`

| Product | Default | Effect |
|---------|---------|--------|
| Credit pack | pack size + pack price from `PricingConfig` | Adds credits; 1 credit per quote |
| Subscription | days + price from config | Unlimited quotes while `subscriptionEndsAt` is future |

**4. Contractor quotes** — `submitQuoteAction` (`src/actions/marketplace/quotes.ts`)

- Must be the invited trader.
- Requires subscription **or** at least 1 credit (`NEED_CREDITS` otherwise).
- Creates `Quote` (`SUBMITTED`, valid for `quoteValidDays`, default **14**).
- Deducts 1 credit when not subscribed.
- Marks the invitation `QUOTED`.
- If the job was `OPEN`, sets it to `QUOTES_RECEIVED`.
- Notifies the customer.

**5. Customer accepts** — `acceptQuoteAction`

One transaction:

- Quote must be `SUBMITTED` and the job `OPEN` or `QUOTES_RECEIVED`.
- Only one quote can be `ACCEPTED`. Others become `NOT_SELECTED`.
- Creates `FeeLedger` (`PENDING`) for platform commission (`commissionRate`, min/max from config).
- Creates `PlatformInvoice` (`ISSUED`, kind `COMMISSION`).
- Job → `AWARDED` (no customer Stripe payment).
- Remaining live invitations → `EXPIRED`.

**Commission (defaults, admin can change)**

| Line | Default | Who pays |
|------|---------|----------|
| Quote | trader’s amount | customer → trader (off-platform) |
| Platform commission | ~8% of quote (clamped) | trader → BuildPro via Stripe |

**6. Trader pays commission** — `createCommissionCheckoutAction`

- Trader pays from job detail (`PayCommissionPanel`).
- Webhook marks fee `COLLECTED` and invoice `PAID`.

**7. Webhook** — `POST /api/stripe/webhook`

| Stripe event / metadata | Effect |
|-------------------------|--------|
| credits pack PI | Add credits |
| subscription PI | Extend `subscriptionEndsAt` |
| commission PI | Fee `COLLECTED`, invoice `PAID` |
| `account.updated` | Connect onboarding flags |
| Legacy escrow PI | Still supported for old `AWAITING_PAYMENT` jobs |

**8. Work** — `src/actions/marketplace/lifecycle.ts`

| Action | Who | From status | To status |
|--------|-----|-------------|-----------|
| `startJobAction` | Accepted trader | `AWARDED` + fee `COLLECTED` (or legacy `FUNDED`) | `IN_PROGRESS` |
| `completeJobAction` | Accepted trader | `AWARDED` / `FUNDED` / `IN_PROGRESS` | `COMPLETED` |
| `confirmJobAction` | Customer | in progress / completed | `PAID_OUT` (no escrow transfer on award path) |
| `cancelJobAction` | Customer | `OPEN` or `QUOTES_RECEIVED` | `CANCELLED` |
| `cancelFundedJobAction` | Customer | `AWARDED` / legacy funded, before start | void fee, `CANCELLED` |

**9. Decline** — contractor `declineInvitationAction`, or `POST /api/jobs/[id]/invitations/[iid]/decline`. Frees a slot and invites the next match.

### Job status

```
OPEN
  → QUOTES_RECEIVED          (first quote)
  → AWARDED                  (quote accepted — current path)
  → IN_PROGRESS              (trader start after commission)
  → COMPLETED                (trader complete)
  → PAID_OUT                 (customer confirm)

Legacy escrow (still in schema)
  → AWAITING_PAYMENT → FUNDED → …

Side exits
  CANCELLED   before accept, or cancel before start
  EXPIRED     where a timeout job is marked
  DISPUTED    protected dispute open (legacy escrow)
  RESOLVED    dispute closed
```

### Same actions over HTTP

The UI uses server actions. These routes call the same logic (useful for tests):

| Method | Path | Action |
|--------|------|--------|
| POST | `/api/jobs` | create job |
| POST | `/api/jobs/[id]/quotes` | submit quote |
| GET | `/api/quotes/[id]/price-preview` | price breakdown |
| POST | `/api/quotes/[id]/accept` | accept quote |
| POST | `/api/jobs/[id]/start` | start |
| POST | `/api/jobs/[id]/complete` | complete |
| POST | `/api/jobs/[id]/confirm` | confirm |
| POST | `/api/jobs/[id]/dispute` | raise dispute |
| POST | `/api/jobs/[id]/report-problem` | unprotected problem report |
| POST | `/api/disputes/[id]/resolve` | admin resolve |

---

## 6. Disputes and problem reports

**Protected only — Raise dispute** (`raiseDisputeAction`)

- Job must be `PROTECTED` and `FUNDED`, `IN_PROGRESS`, or `COMPLETED`.
- Reason at least 10 characters. One open dispute per job.
- Job → `DISPUTED`. Trader and admins notified. Payout blocked.

**Admin resolve** (`resolveDisputeAction`, page `/disputes/[id]`)

| Choice | Money | Job after |
|--------|--------|-----------|
| Full release | Transfer full net to trader | `PAID_OUT` |
| Partial release | Transfer a trader amount, refund the rest | `RESOLVED` |
| Full refund | Stripe refund of the PaymentIntent, fee voided | `RESOLVED` |

**Unprotected — Report a problem** (`reportProblemAction`)

- Writes a log and notifies trader and admins.
- No refund. Shows on `/disputes?tab=reports`.

---

## 7. Service requests and chat (no escrow)

```
Public /services  or  /customer/services
        │
        ▼
requestServiceAction
        │  ServiceRequest status PENDING
        │  email + notification to that contractor
        ▼
Contractor /construction/requests
        │
        ▼
updateRequestStatusAction
   PENDING → ACCEPTED → IN_PROGRESS → COMPLETED
                  └→ REJECTED
        │
        ▼
Messages on that request
   /customer/messages/[id]
   /construction/messages/[id]
   sendMessageAction  (text + optional attachment)
```

- One open request per customer per service (`PENDING`, `ACCEPTED`, or `IN_PROGRESS`).
- Chat is tied to `ServiceRequest`, not to `MarketplaceJob`.
- Status emails use templates such as `service_request_accepted`.
- `POST /api/service-request` is the HTTP form of the same create.

Use this path when the customer picked a specific trader’s listing. Use marketplace jobs when the customer wants matching, quotes, and off-platform hire.

---

## 8. Contractor setup (before they can be paid)

```
/construction/register
        │
        ▼
/construction/services/new     createServiceAction
        │  Service { title, category, price range, isActive }
        ▼
/construction/payouts
        │
        ├─ startConnectOnboardingAction
        │     Stripe Connect account link
        │     return via /api/stripe/connect/refresh
        │     webhook account.updated → stripeOnboardingDone, stripePayoutsEnabled
        │
        └─ createFeeSetupIntentAction + saveFeePaymentMethodAction
              card on file for the success fee
              webhook setup_intent.succeeded → feePaymentMethodId
```

Other contractor pages read the same user: dashboard, invitations, jobs, requests, messages, reviews, earnings, invoices, analytics, team, profile (`updateContractorProfileAction`).

---

## 9. Customer portal (besides the job)

| Page | What it does |
|------|----------------|
| `/customer/dashboard` | Summary of jobs and requests |
| `/customer/jobs` | List of marketplace jobs |
| `/customer/jobs/new` | Post a job |
| `/customer/jobs/[id]` | Quotes, status, confirm, dispute |
| `/customer/jobs/[id]/pay` | Stripe payment |
| `/customer/services` | Browse services (logged in) |
| `/customer/requests` | Service requests |
| `/customer/messages` | Chat threads |
| `/customer/notifications` | In-app notifications |
| `/customer/profile` | `updateClientProfileAction`, password |

---

## 10. Staff dashboard (construction management)

Staff sign in at `/login` and land on `/dashboard`. Pages are server components that query Prisma. Forms call server actions.

This data is the **internal project system**. A marketplace `MarketplaceJob` is not a `Project`. Clients here are the `Client` company records, not only login users.

```
Dashboard  /dashboard
   counts: projects, clients, users, open issues, invoices, tasks

Marketplace ops
   /projects              internal projects (also labeled Projects / Jobs in the nav)
   /admin/services        service catalog oversight
   /disputes              escrow disputes + problem reports
   /clients               client companies
   /contractors           contractor companies (directory, not the login user)

Resources
   /materials             inventory
   /equipment             plant

Operations
   /site-reports          daily site reports (+ /site-reports/new)
   /issues                site issues
   /documents             files on a project

Finance
   /invoices              project invoices and payments (cash, bank, UPI, …)
   /expenses              project expenses

Admin
   /admin                 admin home
   /users                 create staff, activate, reset password
   /roles                 StaffRole + permission list

Settings
   /settings              general
   /settings/pricing      marketplace rates (the money rules)
   /settings/stripe       Stripe env status, webhook URL, Connect overview (keys stay in env)
   Cron                   GET /api/cron/marketplace — invite expiry, expire quotes, auto-confirm
                          Schedule: vercel.json `"0 2 * * *"` (once daily, 02:00 UTC — Vercel Hobby allows only daily crons). Auth: `Authorization: Bearer CRON_SECRET`
                          (set `CRON_SECRET` in Vercel env; Vercel Cron sends the same header automatically).
   Receipts               /customer/jobs/[id]/receipt · /construction/jobs/[id]/receipt (print → PDF)
   Reviews                JobReview after COMPLETED/PAID_OUT/RESOLVED; landing avg from live reviews
   WhatsApp               Optional `wa.me/91…` after quote (India phone on trader profile)
   Flow labels            Sidebar “Marketplace (Escrow)” vs “Services (Chat)” + FlowBadge on pages
   /settings/profile      staff profile
   /settings/email        SMTP
   /settings/email-templates
```

### Project lifecycle (staff)

```
Create client          createClientAction          Client
        │
        ▼
Create project         createProjectAction         Project
   status PLANNING → IN_PROGRESS → ON_HOLD / COMPLETED / CANCELLED
   code, budget, dates, location, manager
        │
        ├─ milestones and tasks     createTaskAction, updateTaskStatusAction
        │     TODO → IN_PROGRESS → REVIEW → COMPLETED, or BLOCKED
        ├─ assign contractors       ProjectContractor (contract value, dates)
        ├─ materials                stock and ProjectMaterial usage
        ├─ equipment                AVAILABLE → IN_USE → MAINTENANCE → RETIRED
        ├─ documents                upload metadata + file URL
        ├─ site reports             createSiteReportAction (weather, labour, photos)
        ├─ issues                   OPEN → IN_PROGRESS → RESOLVED → CLOSED
        ├─ invoices                 createInvoiceAction
        │     DRAFT → SENT → PARTIAL → PAID, or OVERDUE / CANCELLED
        │     record Payment (bank, UPI, cash, cheque, card)
        └─ expenses                 createExpenseAction
```

Invoice money here is **recorded in the app**. It does not go through Stripe escrow. Stripe is only the marketplace job path.

### Users and roles

- `createUserAction` / `updateUserAction` / `deleteUserAction` / `toggleUserActiveAction` / `resetUserPasswordAction`.
- `StaffRole` maps a display name (for example Manager) onto a base `UserRole` plus a permission string list.
- `GET /api/users/[id]` returns one user. `GET /api/admin/export` exports CSV.

### Pricing (changes future quotes only)

`savePricingConfigAction` writes the singleton `PricingConfig` (`key = default`):

- **Lead by job size (default):** Small / Medium / Large bands with lead price min–max (+VAT) and a default charge
  - Small (under £1k): £8–£12 (default £10) · max **3** traders
  - Medium (£1k–£10k): £12–£25 (default £18) · max **3** traders
  - Large (£10k+): £25–£100 (default £37.50) · max **3** traders
- Legacy trader fee types: percentage or fixed (optional)
- Protection fee on/off, rate, default opt-in or opt-out
- When unprotected jobs release (`JOB_START` or `COMPLETION`)
- Quote validity days, invitation expiry hours, auto-confirm days
- `matchingInviteCount` = max traders per lead, max reassignments, terms version

Job post stores `jobSize` from budget. Accept / fee ledger use the band’s default lead charge. Amounts already stored on a payment are not rewritten.

---

## 11. Notifications and email

**In-app** — `createNotification` / `notifyAdmins` insert `Notification`. The bell and `/notifications` (staff), `/customer/notifications`, and `/construction/notifications` list them. Mark read or delete via `src/actions/notifications`.

**Email** — `src/lib/email.ts` loads active `SmtpSettings` and an `EmailTemplate` by key (welcome, reset, service request status, and similar). Admins edit SMTP at `/settings/email` and bodies at `/settings/email-templates`. If SMTP is missing, the send is skipped and the in-app notification still exists.

---

## 12. Data the screens read and write

```
User ─┬─ posted MarketplaceJobs (client)
      ├─ JobInvitations + Quotes (trader)
      ├─ Services + ServiceRequests (trader / client)
      ├─ Messages
      ├─ Notifications
      └─ Stripe Connect + fee card fields

MarketplaceJob
   ├─ JobInvitation
   ├─ Quote ── FeeLedger
   ├─ MarketplacePayment
   ├─ Payout
   └─ Dispute

Project (staff)
   ├─ Milestone → Task → Comment
   ├─ Client, manager User, ClientProject members
   ├─ ProjectContractor → Contractor
   ├─ Material / Equipment links
   ├─ Document, SiteReport, Issue
   └─ Invoice → InvoiceItem + Payment
      Expense
```

`AuditLog` records marketplace creates, accepts, payouts, Stripe events, and dispute decisions.

---

## 13. One-page map

```
PUBLIC
  /  /services  /login  /register  /customer/register  /construction/register

CUSTOMER                         CONTRACTOR                      STAFF
  dashboard                        dashboard                       dashboard
  post job ─────────────────────► invitations                      pricing
  job detail ◄── quotes ────────── invitation detail               disputes
  pay ── Stripe webhook ── FUNDED  start / complete                projects
  confirm / dispute ─────────────► payouts + earnings              clients, contractors
  browse services ──────────────► requests + messages              materials, equipment
  profile                          services, profile, team         site reports, issues
                                                                   invoices, expenses
                                                                   users, roles, email
```

QA steps for the marketplace path, test cards, and the bug template are in [TESTER_GUIDE.md](./TESTER_GUIDE.md).
