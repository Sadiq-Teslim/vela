# vela

> **get paid. on-chain.**

AI-powered invoicing and payment tool for Nigerian freelancers. Describe your job in plain English → Vela generates a professional invoice and contract, attaches a Solana USDC payment link, and autonomously follows up until the invoice is paid. Funds settle to your Raenest stablecoin wallet.

Built for the **SuperteamNG × Raenest · Colosseum Frontier Hackathon** (April 2026).

---

## How it works

1. **Describe your job** — "I built a landing page for a UK client, $800, due in 14 days"
2. **AI generates invoice + contract** — parsed via Groq (llama-3.3-70b), formatted with Vela branding
3. **Solana payment link** — unique USDC payment URL per invoice, QR code for Phantom/Backpack
4. **Client pays in USDC** — transaction is verified on-chain, invoice flips to PAID
5. **Funds settle to Raenest** — USDC lands in freelancer's Raenest stablecoin wallet → USD → NGN
6. **Agentic follow-ups** — AI drafts reminder emails (reminder / due date / overdue) and sends via Resend

---

## Tech stack

| Layer | Tech |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| Styling | Tailwind CSS v3 |
| Auth + DB | Supabase (PostgreSQL + Auth + RLS + Realtime) |
| AI | Groq SDK (`llama-3.3-70b-versatile`) |
| Blockchain | `@solana/web3.js` + `@solana/spl-token` |
| Payment settlement | Raenest stablecoin wallet (USDC on Solana) |
| PDF | `@react-pdf/renderer` |
| Email | Resend |
| Monorepo | Turborepo + pnpm |

---

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/Sadiq-Teslim/vela.git
cd vela
pnpm install
```

### 2. Supabase setup

Create a Supabase project at [supabase.com](https://supabase.com). In the SQL Editor, run the migrations in order:

- [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql) — tables, RLS policies, invoice numbering
- [`supabase/migrations/002_profile_insert_policy.sql`](supabase/migrations/002_profile_insert_policy.sql)
- [`supabase/migrations/003_public_profile_read.sql`](supabase/migrations/003_public_profile_read.sql)
- [`supabase/migrations/004_mark_invoice_paid_rpc.sql`](supabase/migrations/004_mark_invoice_paid_rpc.sql)

Then enable **Realtime** on the `invoices` table (Database → Replication).

### 3. Environment variables

Copy `apps/web/.env.example` → `apps/web/.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

GROQ_API_KEY=gsk_...

NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet

RESEND_API_KEY=re_...
FROM_EMAIL=invoices@vela.so

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Get API keys:
- **Groq** — [console.groq.com](https://console.groq.com) (free tier)
- **Resend** — [resend.com](https://resend.com) (optional for emails)

### 4. Run

```bash
pnpm dev
```

App runs at `http://localhost:3000`.

---

## Project structure

```
vela/
├── apps/web/                  # Next.js 16 app
│   ├── app/
│   │   ├── (auth)/           # Login, signup
│   │   ├── api/              # API routes (generate, verify, PDF, email)
│   │   ├── auth/callback/    # OAuth callback
│   │   ├── dashboard/        # Main hub
│   │   ├── invoice/          # New / preview / contract / detail
│   │   ├── pay/[invoiceId]/  # Public client payment page
│   │   └── settings/         # Profile, Raenest wallet, follow-up prefs
│   ├── components/
│   │   ├── layout/           # Sidebar + AppShell
│   │   └── ui/               # Button, Badge, Card, Input, Toast, etc.
│   ├── lib/
│   │   ├── supabase/         # Browser + server clients, middleware
│   │   ├── hooks/            # useAuth
│   │   ├── groq.ts           # Groq client + JSON parser
│   │   ├── solana.ts         # Solana Pay + tx verification
│   │   └── pdf/              # React-PDF invoice + contract template
│   └── types/database.ts     # Typed models
├── supabase/migrations/      # SQL schema + policies + RPCs
└── vela-prd.docx             # Product requirements doc
```

---

## Feature set (MVP)

- [x] Email + password auth (Supabase)
- [x] AI invoice generation (Groq llama-3.3-70b)
- [x] AI contract generation (Nigerian law, kill fee, IP clauses)
- [x] Editable invoice and contract previews
- [x] Solana USDC payment link per invoice (devnet + mainnet)
- [x] QR code for Phantom / Backpack / any Solana wallet
- [x] On-chain transaction verification
- [x] Manual tx signature fallback
- [x] Auto-refresh dashboard via Supabase Realtime
- [x] PDF invoice + contract export
- [x] AI-drafted follow-up emails (reminder / due date / overdue)
- [x] Email delivery via Resend
- [x] Raenest wallet settings
- [x] Status timeline per invoice
- [x] Mobile responsive

---

## Hackathon submission

**Track:** SuperteamNG × Raenest · Colosseum Frontier Side Track
**Deadline:** May 11, 2026
**Prize pool:** $10,000 USDG

Vela checks every side-track requirement: Raenest settlement (USDC → USD → NGN), Solana-native payments, AI-driven workflow, and a real Nigerian freelancer persona.

---

## License

MIT
