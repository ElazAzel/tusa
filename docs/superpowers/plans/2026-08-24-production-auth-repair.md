# Production Auth Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the local database-backed account flow resolve consistently in every Next.js bundler and deploy a verified production build.

**Architecture:** The application intentionally maps Clerk-compatible imports to the local auth implementation. The alias must be configured for both Turbopack and Webpack so the UI, route handlers, and server pages share `tusa_auth` and `local_accounts`. A source-level regression test will lock this contract.

**Tech Stack:** Next.js 16, TypeScript, React 19, local auth over Neon Postgres, Node test runner, Vercel CLI.

**Spec:** Existing account failure diagnosis from the 2026-08-24 production health investigation.

## Global Constraints

- Production schema gate remains at version 12.
- No secrets or database contents may be written to the repository or printed.
- Do not fabricate Resend, DNS, or MFA credentials; report those external gates when unavailable.
- Russian user-facing text must follow the repository humanizer-ru rules.
- Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` before deployment.

---

### Task 1: Lock the bundler auth-alias contract

**Files:**
- Modify: `tests/platform-foundation.test.mjs`
- Modify: `next.config.ts`

**Interfaces:**
- Consumes: existing `@clerk/nextjs` and `@clerk/nextjs/server` imports.
- Produces: identical local-auth resolution under Turbopack and Webpack.

- [ ] **Step 1: Write the failing test**

Add a source contract test that reads `next.config.ts` and requires a `webpack` resolver alias for both local auth entry points.

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- --test-name-pattern="bundler auth aliases"`

Expected: FAIL because `next.config.ts` currently defines only `turbopack.resolveAlias`.

- [ ] **Step 3: Implement the minimal config change**

Add a typed `webpack` callback that merges absolute aliases for `@clerk/nextjs` and `@clerk/nextjs/server` while preserving the current Turbopack aliases.

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `npm test -- --test-name-pattern="bundler auth aliases"`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/platform-foundation.test.mjs next.config.ts docs/superpowers/plans/2026-08-24-production-auth-repair.md
git commit -m "fix: keep local auth aliases across next bundlers"
```

### Task 2: Verify database and production behavior

**Files:**
- No source changes.

**Interfaces:**
- Consumes: production Vercel environment and Neon connection.
- Produces: non-sensitive evidence for schema, auth tables, and health status.

- [ ] **Step 1: Query production auth table metadata without printing secrets**

Use the linked Vercel project to load production variables into an explicitly temporary file, run read-only `information_schema` and row-count queries, then remove the temporary file after verifying its exact path.

- [ ] **Step 2: Run the full test, typecheck, lint, and build gates**

Run: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.

- [ ] **Step 3: Recheck the production health endpoint**

Confirm database readiness and schema version after the deployment artifact is available.

### Task 3: Deploy and report external blockers

**Files:**
- No additional source changes.

**Interfaces:**
- Consumes: verified repository commit and linked Vercel project.
- Produces: GitHub commit and Vercel production deployment.

- [ ] **Step 1: Push the verified commit to GitHub**
- [ ] **Step 2: Deploy the verified artifact to Vercel production**
- [ ] **Step 3: Verify deployment status and public auth routes**
- [ ] **Step 4: Report DNS, Resend, and admin-MFA prerequisites that cannot be completed without external credentials**
