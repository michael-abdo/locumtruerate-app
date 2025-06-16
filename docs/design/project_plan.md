# LocumTrueRate.com Project Plan

## Project Evolution
**Current Status**: We have successfully built a foundational job board with Cloudflare Workers that will be **migrated and enhanced** into the full LocumTrueRate.com platform.

**Next Phase**: Transform the existing job board into a comprehensive monorepo with contract/paycheck calculators and mobile apps.

## 1. Final Constraints
| Item            | Final Value                            | Notes / Source                                                                 |
|-----------------|----------------------------------------|--------------------------------------------------------------------------------|
| Budget          | US $7,000                              | Upwork job posting project_description overrides earlier $4.7 k drafts         |
| Timeline        | 6 weeks (42 days)                      | Client instruction; replaces 4‑week (Implementation Plan) and 9‑week (Upwork metadata) inconsistencies |
| Deploy Targets  | Web (Cloudflare Pages + Workers), iOS, Android | Mobile delivery required by requirements.md                                   |
| Code‑Reuse Goal | ≥ 80 % shared TypeScript              | Achieved through TurboRepo monorepo (see § 2)                                  |

---

## 2. Architecture Overview – TurboRepo
```
repo-root/
├─ apps/
│  ├─ web/         # Next.js 14 (pages router) – SSR & static web
│  └─ mobile/      # Expo Router (React Native) – iOS & Android
├─ packages/
│  ├─ ui/          # Reusable design‑system components (Tailwind + Tamagui)
│  ├─ calc-core/   # Pure TS contract & paycheck engines (node & browser)
│  ├─ api/         # tRPC handlers deployed via Cloudflare Workers
│  └─ config/      # eslint‑config, ts‑config, jest presets
└─ turbo.json      # Pipeline + Remote Cache (Cloudflare R2)
```
Single source of truth for `calc-core` guarantees the 80 % reuse target.

---

## 3. Technical Stack
| Layer               | Technology                           | Rationale                                                                  |
|---------------------|--------------------------------------|---------------------------------------------------------------------------|
| Monorepo & Build    | TurboRepo + pnpm                      | Incremental builds, remote cache, first‑class Next.js + Expo support       |
| Web App             | Next.js 14 on Cloudflare Pages + KV   | Edge‑rendered pages, instant global TTFB                                  |
| Mobile App          | Expo SDK 51 (React Native)            | Single JS codebase, OTA updates, EAS Build for store binaries              |
| API                 | tRPC deployed as Cloudflare Workers   | Type‑safe end‑to‑end contracts                                             |
| Auth                | Clerk (or NextAuth v5)                | Drop‑in JWT/OAuth; scales to store sessions in CF KV/Redis                 |
| DB                  | PostgreSQL (Neon)                     | Serverless, branching for previews; Prisma for ORM                         |
| CI/CD               | GitHub Actions + Turbo cache; EAS Submit | Automated preview URLs & store uploads                                   |
| Monitoring          | Sentry (web + mobile) & CF Analytics  | Error and performance tracing                                              |

---

## 4. Migration Strategy & Six‑Week Schedule

### Phase 1: Foundation ✅ COMPLETED
- Built comprehensive job board with Cloudflare Workers
- Implemented authentication, applications, email notifications
- Created analytics dashboard and enterprise features
- Added security hardening (PBKDF2, JWT, rate limiting)

### Phase 2: Transform to LocumTrueRate.com (6 weeks remaining)
| Week | Key Goals                   | Major Deliverables                                                       |
|------|-----------------------------|---------------------------------------------------------------------------|
| 1    | Monorepo migration         | Migrate existing job board to TurboRepo structure, add calc-core         |
| 2    | Core engines & Auth         | `calc-core` library, enhanced auth for mobile, contract calculators      |
| 3    | Feature build‑out (Web)     | Paycheck calculators, enhanced job board with LocumTrueRate branding     |
| 4    | Mobile shell + shared UI    | Expo app shell, React Navigation, migrate job board to mobile            |
| 5    | Store & Edge Deploy         | Cloudflare Pages prod, EAS store builds, domain setup                    |
| 6    | Hardening & Handover        | Load test, acceptance test, documentation, Phase‑2 backlog               |

---

## 5. Budget Allocation (High-Level)
| Bucket               | %   | Amount | Notes                                                               |
|----------------------|-----|--------|---------------------------------------------------------------------|
| Engineering labour    | 70% | $4,900 | Full‑stack dev 240 h × $20 h                                       |
| DevOps & services     | 10% | $700   | Clerk, CF Workers KV, Expo EAS                                     |
| QA & Test devices     | 6%  | $420   | BrowserStack, iOS & Android benches                                |
| Store fees & assets   | 5%  | $350   | Apple Dev Program, Play Console, iconography                       |
| Contingency           | 9%  | $630   | Buffer for unexpected review rejections                            |
| **Total**             |     | $7,000 |                                                                     |

---

## 6. Risk Register & Mitigations
| Risk                                | Likelihood | Mitigation                                                                |
|-------------------------------------|------------|---------------------------------------------------------------------------|
| App‑store review delay              | Med        | Submit in Week 5; pre‑validate with Expo EAS QA scripts                   |
| Calculation parity bugs (web/mobile)| Low        | Shared calc-core + Jest + Detox tests                                    |
| Performance @ 100+ concurrent users | Med        | CF KV session store + Postgres pool; load test in Week 6 (JMeter)        |
| Scope creep (dashboards, analytics) | High       | Lock scope; Phase-2 backlog; require signed addendum for new features    |
