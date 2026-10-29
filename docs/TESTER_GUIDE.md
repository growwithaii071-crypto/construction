# BuildPro Marketplace — Tester Guide

Manual QA guide for the marketplace flow: **post job → match traders → quote → pay (escrow) → work → confirm / dispute → payout**.

Use this document for staging / production smoke tests and full regression of pricing, payments, and disputes.

---

## 1. Roles & portals

| Role | Who | Login | Home after login |
|------|-----|-------|------------------|
| **Customer (Client)** | Homeowner / job poster | `/login` | `/customer/dashboard` |
| **Contractor (Trader)** | Service provider | `/login` | `/construction/dashboard` |
| **Admin / Super Admin** | Ops & pricing | `/login` | `/dashboard` |

**Register**

| Role | URL |
|------|-----|
| Customer | `/customer/register` |
| Contractor | `/construction/register` |

**Seeded admin (local / after `npm run db:seed`)**

| Email | Password | Role |
|-------|----------|------|
| `admin@construction.com` | `Admin@123` | Super Admin |

> Seed does **not** create marketplace customer/contractor login users. Register fresh accounts for marketplace tests, or use existing app users with roles `CLIENT` / `CONTRACTOR`.

---

## 2. Prerequisites before payment tests

### App

- App URL (local example): `http://localhost:3000`
- Database seeded or migrated (`prisma db push` / migrate + optional seed)
- Env vars present (see `.env.example`):
  - `STRIPE_SECRET_KEY` (`sk_test_…`)
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_test_…`)
  - `STRIPE_WEBHOOK_SECRET` (`whsec_…`)
  - `NEXTAUTH_URL` / `NEXTAUTH_SECRET`

### Stripe (test mode)

1. Use **test** keys only.
2. Forward webhooks locally:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

3. Copy the CLI webhook signing secret into `STRIPE_WEBHOOK_SECRET`.
4. Spec alias path (same handler): `POST /api/payments/webhook`.

### Stripe test cards

| Card | Result |
|------|--------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 9995` | Decline |
| Any future expiry, any 3-digit CVC, any postal code | — |

---

## 3. Important URLs (cheat sheet)

### Public

| Page | Path |
|------|------|
| Landing | `/` |
| Find traders / services | `/services` |
| Login | `/login` |

### Customer

| Page | Path |
|------|------|
| Dashboard | `/customer/dashboard` |
| My Jobs | `/customer/jobs` |
| Post a Job | `/customer/jobs/new` |
| Job detail | `/customer/jobs/[id]` |
| Pay for job | `/customer/jobs/[id]/pay` |
| Browse services (chat path) | `/customer/services` |
| My requests (chat path) | `/customer/requests` |
| Messages | `/customer/messages` |

### Contractor

| Page | Path |
|------|------|
| Dashboard | `/construction/dashboard` |
| Payouts & Verify (Stripe Connect + fee card) | `/construction/payouts` |
| Job invitations | `/construction/invitations` |
| Invitation detail | `/construction/invitations/[id]` |
| Accepted jobs | `/construction/jobs` |
| Job detail | `/construction/jobs/[id]` |
| My services | `/construction/services` |

### Admin

| Page | Path |
|------|------|
| Marketplace pricing | `/settings/pricing` |
| Disputes queue | `/disputes` |
| Dispute detail | `/disputes/[id]` |
| Problem reports tab | `/disputes?tab=reports` |

---

## 4. Job status glossary

| Status | Meaning |
|--------|---------|
| `OPEN` | Job posted; matching invitations |
| `QUOTES_RECEIVED` | At least one quote submitted |
| `AWAITING_PAYMENT` | Quote accepted; customer must pay |
| `FUNDED` | Payment succeeded (escrow held) |
| `IN_PROGRESS` | Trader marked started |
| `COMPLETED` | Trader marked complete; waiting confirm |
| `PAID_OUT` | Trader payout released |
| `DISPUTED` | Protected dispute open; **payout blocked** |
| `RESOLVED` | Dispute closed (refund / partial / after resolve flow) |
| `CANCELLED` | Cancelled before / after funding (rules apply) |
| `EXPIRED` | Timed out (where implemented) |

**Protection**

| Value | Behaviour |
|-------|-----------|
| `PROTECTED` | Escrow held until confirm / auto-confirm; customer can **Raise dispute** |
| `UNPROTECTED` | Often releases at job start; customer can only **Report a problem** (no refund guarantee) |
| `UNDECIDED` | Quote not accepted yet / protection not chosen |

---

## 5. End-to-end happy path (Protected)

Use **two browsers** (or one normal + one incognito): Customer + Contractor. Optionally a third for Admin.

### A. Prepare contractor (must be “verified”)

A trader is **verified** only when **all** are true:

1. Stripe Connect onboarding completed  
2. Payouts enabled on the Connect account  
3. Success-fee payment method saved (card via SetupIntent)

**Steps**

1. Register contractor → `/construction/register` → login.
2. Add at least one **active service** with a clear **category** (e.g. Plumbing) → `/construction/services/new`.
3. Open `/construction/payouts`:
   - Complete **Stripe Connect** onboarding (test mode).
   - Save a **fee payment card** (`4242…`).
4. Confirm UI shows verified / ready to receive invitations & quote.

> Unverified traders are deprioritised / blocked from quoting. Matching prefers verified traders.

### B. Customer posts a job

1. Register customer → `/customer/register` → login.
2. Go to **Post a Job** → `/customer/jobs/new`.
3. Fill title, description, **category** (must align with trader service category for matching), location, budget.
4. Submit → lands on job detail `/customer/jobs/[id]`.
5. Expect status `OPEN` and trader invitations (target up to **3** live invites).

### C. Contractor quotes

1. As contractor → `/construction/invitations`.
2. Open invitation → review job → submit quote (amount + optional scope).
3. Expect customer job to move toward `QUOTES_RECEIVED`.
4. Customer sees quote on job detail.

### D. Customer accepts quote + chooses protection

1. Customer → job detail → **Review & accept** on a submitted quote.
2. Review **price preview**:
   - Quote amount  
   - Trader success fee (platform; from trader, not usually added as separate customer line the same way)  
   - Protection fee (if opted in)  
   - Totals: Protected vs Unprotected  
3. Opt **in** to Payment Protection for this path.
4. Accept → status `AWAITING_PAYMENT` → go to Pay.

### E. Pay (escrow)

1. Open `/customer/jobs/[id]/pay`.
2. Pay with test card `4242…`.
3. After Stripe confirms (webhook), status becomes `FUNDED`.
4. Customer sees funded message; funds held for Protected jobs.

### F. Work lifecycle

| Actor | Action | Expected |
|-------|--------|----------|
| Trader | **Mark started** | `IN_PROGRESS` |
| Trader | **Mark complete** | `COMPLETED` |
| Customer | **Confirm** | Payout released → `PAID_OUT` (Protected) |

Optional: wait for **auto-confirm** (default ~5 days after complete — configurable in Admin pricing) and verify payout without manual confirm.

### G. Trader checks payout

- `/construction/jobs/[id]` shows net payout / fee ledger.  
- `/construction/payouts` or earnings reflect transfer (test mode).

---

## 6. Unprotected path (contrast test)

1. Repeat accept quote but choose **Unprotected** (no protection fee).
2. Pay → `FUNDED`.
3. Trader **Mark started** → expect payout rules for unprotected (often release at start if configured).
4. On job detail, customer sees **Report a problem** (not Raise dispute).
5. Submit a report → admin `/disputes?tab=reports` shows log; **no automatic refund**.

---

## 7. Dispute path (Protected only)

### Raise

1. Job must be Protected and status one of: `FUNDED` / `IN_PROGRESS` / `COMPLETED` (not already paid out).
2. Customer → **Raise dispute** → reason (≥ 10 characters).
3. Expect:
   - Job status `DISPUTED`
   - Trader notified
   - Admin notified
   - **Payout blocked** while disputed

### Admin resolve

1. Admin → `/disputes` → open dispute.
2. Choose one:

| Resolution | Expected |
|------------|----------|
| **Full release** | Trader paid; dispute closed; job paid out |
| **Partial release** | Amount to trader + remainder (+ protection fee where applicable) refunded to customer |
| **Full refund** | Customer refunded; fee voided if still pending; job resolved |

3. Confirm customer + trader get notifications / updated job status.

### Negative checks

- Unprotected job → Raise dispute rejected; only Report a problem.  
- Confirm / payout while `DISPUTED` → blocked.  
- Second open dispute on same job → rejected.

---

## 8. Admin pricing config

Path: `/settings/pricing` (Admin / Super Admin).

Verify editable fields affect new accepts / previews:

| Setting | What to check |
|---------|----------------|
| Trader success fee % / fixed + optional cap | Preview fee on accept panel |
| Protection fee % + enable/disable | Protected total changes |
| Protection default (opt-in / opt-out) | Default checkbox state on accept |
| Quote valid days | Quote expiry copy |
| Invitation expiry hours | Invitation expiry on UI |
| Auto-confirm days | Documented wait for auto payout |
| Matching invite count (default 3) | Number of live invitations |

Save → post a new job / accept a new quote → confirm preview numbers match formula:

- Trader fee ≈ rate × quote (respecting cap if set)  
- Protection fee ≈ protection rate × quote (when protected)  
- Customer protected total ≈ quote + protection fee  

---

## 9. Matching & invitations checklist

- [ ] Verified trader with matching **category** gets invited preferentially  
- [ ] Up to **3** live invitations (or configured count)  
- [ ] Declined / expired invitation frees a slot for reassignment  
- [ ] Customer job detail shows invitation ranks + status  
- [ ] Contractor can decline invitation  
- [ ] Cancel job while `OPEN` / `QUOTES_RECEIVED` works  

---

## 10. Parallel legacy flows (do not confuse)

The app still has the older **service request + chat** path:

| Flow | Entry |
|------|--------|
| Browse services → request → message | `/services` or `/customer/services` → requests → messages |
| Marketplace jobs / quotes / escrow | `/customer/jobs` |

Testers should **label which flow** they used in bug reports.

---

## 11. Smoke checklist (30–45 min)

Copy into a test run ticket:

- [ ] Customer register + login  
- [ ] Contractor register + login  
- [ ] Contractor adds service (category)  
- [ ] Contractor completes Connect + fee card → verified  
- [ ] Customer posts job (same category)  
- [ ] Invitations appear for contractor  
- [ ] Quote submitted  
- [ ] Accept with **Protected** + price preview looks correct  
- [ ] Pay with `4242` → `FUNDED` (webhook)  
- [ ] Start → Complete → Confirm → `PAID_OUT`  
- [ ] Accept **Unprotected** path on another job → Report problem only  
- [ ] Protected dispute → admin full refund OR full release  
- [ ] Admin pricing page loads and saves  
- [ ] Decline invitation / cancel open job  

---

## 12. Known test caveats

1. **Webhooks required** — without Stripe webhook (or CLI forward), jobs may stay `AWAITING_PAYMENT` after a successful card charge.  
2. **Verified traders** — without Connect + fee card, quoting / matching will fail or look empty.  
3. **Category mismatch** — if customer category ≠ trader service category, invitations may be empty.  
4. **Test vs live Stripe** — never mix live keys on staging.  
5. **Auto-confirm** — slow by design (days); use manual Confirm for most runs.  
6. **Timestamps in old deploy logs** — if a build error looks familiar, confirm the deploy commit SHA matches latest `main`.

---

## 13. Bug report template

```text
Title: [Role] Short description
Environment: staging / production / local — URL:
Commit / deploy: 
Role & account: Customer / Contractor / Admin — email used:
Flow: Marketplace jobs  OR  Services chat
Steps:
1.
2.
3.
Expected:
Actual:
Job ID / Dispute ID / Quote ID (if any):
Stripe PaymentIntent / screenshot:
Browser:
Notes (Protected / Unprotected, amounts):
```

---

## 14. Quick formula reference (default config)

Defaults when Admin has not changed pricing:

| Item | Default |
|------|---------|
| Trader success fee | 10% of quote |
| Protection fee | 3% of quote (if Protected) |
| Quote validity | 14 days |
| Invitation expiry | 48 hours |
| Auto-confirm | 5 days after complete |
| Live invites | 3 |

Example: quote **₹10,000** Protected → protection fee **₹300** → customer pays **≈ ₹10,300**. Trader success fee **₹1,000** is deducted from trader payout (platform fee), not necessarily charged as an extra customer line beyond protection.

---

## 15. Contacts for blockers

- Missing Stripe / webhook / env → ask engineering before marking payment tests failed.  
- Empty invitations → check trader verification + category + `isActive` service.  
- Dispute / payout stuck → check job status is not `DISPUTED` and admin `/disputes` queue.

---

*Last updated for marketplace pricing, escrow, Connect payouts, and disputes (Phases 1–8).*
