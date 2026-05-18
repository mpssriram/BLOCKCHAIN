# CODEBASE_REVIEW

Static audit of the current PayStream repository on 2026-05-18.

Scope of this pass:
- No application code changes were made.
- No files were deleted, renamed, or moved.
- No routes, schema, or contract logic were changed.
- Findings below are based on current repository contents and static wiring.

## 1. Current backend entry points

- `Backend/main.py`
  - Primary FastAPI app.
  - Includes routers from `auth.py`, `api_routes.py`, and `blockchain_routes.py` under `/api`.
  - Also serves built frontend assets from `frontpage/dist` and `Frontendemployee/dist` when present.
- `dev_all.py`
  - Local multi-process dev launcher for backend + both frontends.
- `render.yaml`
  - Deployment config that references backend startup.
- `start-dev.bat`
  - Local startup helper.

## 2. Current backend routes

Base app routes in `Backend/main.py`:
- `GET /`
- `GET /employee`
- `GET /employee/{full_path:path}`
- `GET /{full_path:path}`

Auth routes in `Backend/auth.py` with `/api` prefix:
- `POST /api/firebase-login`
- `POST /api/register`
- `POST /api/login`

Blockchain config route in `Backend/blockchain_routes.py` with `/api` prefix:
- `GET /api/blockchain/config`

API routes in `Backend/api_routes.py` with `/api` prefix:

Payroll intents:
- `POST /api/payroll/intents`
- `GET /api/payroll/intents`
- `GET /api/payroll/intents/{intent_id}`
- `POST /api/payroll/intents/{intent_id}/submit-hash`

Blockchain sync:
- `POST /api/blockchain/sync-events`

Employees:
- `GET /api/employees/`
- `POST /api/employees/`
- `GET /api/employees/{employee_id}`
- `GET /api/employees/{employee_id}/transactions`
- `PUT /api/employees/{employee_id}/wallet`
- `PUT /api/employees/{employee_id}/tax`
- `PATCH /api/employees/{employee_id}/deactivate`
- `DELETE /api/employees/{employee_id}`

Stream controls and tx tracking:
- `POST /api/stream/start/{employee_id}`
- `POST /api/stream/pause/{employee_id}`
- `POST /api/stream/cancel/{employee_id}`
- `POST /api/stream/status`
- `POST /api/stream/record`
- `GET /api/stream/status/{tx_hash}`
- `PATCH /api/stream/status/{tx_hash}`

Transactions and bonuses:
- `POST /api/transactions/`
- `POST /api/bonuses/{employee_id}`

Treasury:
- `GET /api/treasury`
- `GET /api/treasury/health`
- `GET /api/treasury/summary`
- `POST /api/treasury/sync`
- `POST /api/treasury/deposit`
- `POST /api/treasury/withdraw`

Admin logs:
- `POST /api/admin/logs`
- `GET /api/admin/logs`

Dashboard:
- `GET /api/dashboard/total-payout`
- `GET /api/dashboard/total-tax`
- `GET /api/dashboard/active-streams`
- `GET /api/dashboard/top-earners`
- `GET /api/dashboard/monthly-summary`

Reports:
- `GET /api/reports/monthly`
- `GET /api/reports/employees/{employee_id}`
- `GET /api/reports/tax`

Notifications:
- `POST /api/notifications/email`
- `GET /api/notifications`

Stream history:
- `GET /api/streams/history`

Settings:
- `GET /api/settings/company-tax`
- `POST /api/settings/company-tax`
- `GET /api/settings/tax-slabs`
- `POST /api/settings/tax-slabs`
- `DELETE /api/settings/tax-slabs/{slab_id}`

Employee self-service:
- `GET /api/me/transactions`
- `GET /api/me/profile`
- `GET /api/me/stream`
- `GET /api/streams/{employee_id}`
- `PUT /api/me/wallet`
- `POST /api/me/withdrawals/record`

## 3. Current frontend pages

Employer/frontpage app in `frontpage/src`:
- Landing page assembled inside `frontpage/src/app/App.tsx`
- `pages/Auth/AuthChoice.tsx`
- `pages/Auth/EmployerLogin.tsx`
- `pages/Auth/EmployeeLogin.tsx`
- `pages/Auth/SetToken.tsx`
- `pages/Auth/AutoLogin.tsx`
- `pages/EmployerLayout/Overview.tsx`
- `pages/EmployerLayout/Employees.tsx`
- `pages/EmployerLayout/Layout/EmployeeDetails.tsx`
- `pages/EmployerLayout/Treasury.tsx`
- `pages/EmployerLayout/Bonuses.tsx`
- `pages/EmployerLayout/Settings.tsx`

Employee app in `Frontendemployee/src`:
- No route-based pages.
- Single shell page in `Frontendemployee/src/app/App.tsx` with tab states:
  - `overview`
  - `personal`
  - `transactions`
  - `history`

## 4. Current major frontend components

Employer/frontpage components:
- `frontpage/src/app/components/Hero.tsx`
- `frontpage/src/app/components/LoginCards.tsx`
- `frontpage/src/app/components/TransactionsShowcase.tsx`
- `frontpage/src/app/components/Features.tsx`
- `frontpage/src/app/components/Footer.tsx`
- `frontpage/src/app/components/ProtectedRoute.tsx`
- `frontpage/src/app/components/TowerLoader.tsx`
- `frontpage/src/app/components/EntrySection.tsx`

Employee app components:
- `Frontendemployee/src/app/components/Sidebar.tsx`
- `Frontendemployee/src/app/components/StatCard.tsx`
- `Frontendemployee/src/app/components/TransactionGraph.tsx`
- `Frontendemployee/src/app/components/TransactionHistory.tsx`
- `Frontendemployee/src/app/components/PersonalSetup.tsx`
- `Frontendemployee/src/app/components/TowerLoader.tsx`
- `Frontendemployee/src/app/components/LiveSalaryCounter.tsx`
- `Frontendemployee/src/app/components/YieldFeatures.tsx`

## 5. Current API helper/client files

Backend-facing frontend helpers:
- `frontpage/src/app/api.ts`
- `frontpage/src/app/auth.ts`
- `frontpage/src/app/firebase.ts`
- `Frontendemployee/src/app/api.ts`

Frontend blockchain helpers:
- `frontpage/src/blockchain/config.ts`
- `frontpage/src/blockchain/wallet.ts`
- `Frontendemployee/src/blockchain/config.ts`
- `Frontendemployee/src/blockchain/wallet.ts`

## 6. Current services

In `Backend/service.py`:
- `EmployeeService`
- `TaxService`
- `TreasuryService`
- `TreasurySyncService`
- `TransactionService`
- `BonusService`
- `DashboardService`
- `AdminActionLogService`
- `NotificationLogService`
- `EmailNotifier`
- `NotificationService`
- `ReportingService`
- `BlockchainEventSyncService`
- `PayrollIntentService`
- `PhaseOneService`
- `StreamingService`
- `BlockchainTxService`

Other service-style modules:
- `Backend/security.py` -> `SecurityService`
- `Backend/database.py` -> `Database`
- `Backend/stream_chain.py` -> on-chain stream read helper
- `Backend/export.py` -> CSV/PDF export helpers

## 7. Current database models

In `Backend/models.py`:
- `Employee`
- `Transaction`
- `Bonus`
- `CompanySettings`
- `TaxSlab`
- `Treasury`
- `PayrollEvent`
- `PayrollIntent`
- `AdminActionLog`
- `NotificationLog`
- `BlockchainTransaction`
- `BlockchainSyncState`
- `User`

## 8. Current smart contract files

- `deploy/contracts/CorePayroll.sol`
- `deploy/scripts/deploy.js`
- `deploy/test/CorePayroll.test.js`

## 9. Current scripts/config files

Root:
- `dev_all.py`
- `render.yaml`
- `start-dev.bat`
- `README.md`
- `PHASE1_SYSTEM.md`
- `PHASE2_SYSTEM.md`
- `PHASE3_SYSTEM.md`
- `PHASE4_SYSTEM.md`

Backend:
- `Backend/requirements.txt`
- `Backend/config.py`

Employer frontend:
- `frontpage/package.json`
- `frontpage/package-lock.json`
- `frontpage/vite.config.ts`
- `frontpage/vercel.json`
- `frontpage/postcss.config.mjs`

Employee frontend:
- `Frontendemployee/package.json`
- `Frontendemployee/package-lock.json`
- `Frontendemployee/vite.config.ts`
- `Frontendemployee/vercel.json`
- `Frontendemployee/postcss.config.mjs`

Blockchain/deploy:
- `deploy/package.json`
- `deploy/package-lock.json`
- `deploy/hardhat.config.js`
- `deploy/README.md`

## 10. Possible bugs

- `FIXED 2026-05-18` `Frontendemployee/src/app/App.tsx:219-224`
  - Employee name rendering now reads the nested backend profile shape via `profile.employee.name` while preserving fallback to the previous top-level field.

- `FIXED 2026-05-18` `Backend/export.py:17` and `Backend/api_routes.py:161`
  - The report route no longer returns HTML bytes while claiming `application/pdf`.
  - The temporary `format=pdf` path now returns HTML safely until real PDF generation is implemented.

- `FIXED 2026-05-18` `Backend/service.py:81` and `Backend/service.py:258`
  - Placeholder treasury sync no longer mutates treasury balances.
  - Unimplemented on-chain sync now returns HTTP 501 before any DB write.

- `FIXED 2026-05-18` `frontpage/src/pages/EmployerLayout/Bonuses.tsx:33-35`
  - Bonus preview no longer hardcodes 10%.
  - It now estimates from company tax or employee custom tax and labels the result as estimated.

- `FIXED 2026-05-18` `frontpage/src/pages/EmployerLayout/Settings.tsx:107` and `frontpage/src/pages/EmployerLayout/Settings.tsx:281`
  - Employee tax save now blocks frontend submission when no employee is selected and shows a clear validation message.

- `SAFE_FIX` `Frontendemployee/src/app/App.tsx:219-224`
  - Employee header reads `profile?.name`, but backend `/api/me/profile` returns `employee.name` nested inside `employee`.
  - Result: employee app likely shows `User` instead of the actual employee name even when profile data exists.

- `NEEDS_TESTING` `Backend/export.py:17` and `Backend/api_routes.py:161`
  - `export_pdf()` returns raw HTML bytes while the route responds with `media_type="application/pdf"`.
  - Monthly/tax report PDF downloads are very likely invalid PDFs.

- `NEEDS_TESTING` `Backend/service.py:81` and `Backend/service.py:258`
  - `read_onchain_balance()` is a placeholder returning `0.00`, but `TreasurySyncService.sync_onchain_balance()` uses it as if it were real chain state.
  - `/api/treasury/sync` can overwrite stored on-chain balance with fake data.

- `SAFE_FIX` `Frontendemployee/src/app/App.tsx:172`, `Frontendemployee/src/app/App.tsx:266-297`, `frontpage/src/pages/EmployerLayout/Overview.tsx:83`
  - Hardcoded payroll date `30 March 2026` appears in both UIs.
  - Date will become stale and misleading without any backend-driven schedule.

- `SAFE_FIX` `frontpage/src/pages/EmployerLayout/Bonuses.tsx:33-35`
  - Bonus page always previews tax as 10%, but actual backend tax can vary by company setting or employee override.
  - UI preview can disagree with the actual transaction outcome.

- `SAFE_FIX` `frontpage/src/pages/EmployerLayout/Settings.tsx:107` and `frontpage/src/pages/EmployerLayout/Settings.tsx:281`
  - Saving employee custom tax does not guard against empty employee selection.
  - `Number(selectedEmployee)` becomes `0`, which will fail against the backend with a confusing error.

- `UNCERTAIN` `Backend/main.py:38-94`
  - Startup performs ad hoc `ALTER TABLE` attempts and swallows all exceptions.
  - This can hide migration/state problems in production, but changing it touches schema boot behavior and should be treated carefully.

## 11. Broken imports

- `SAFE_DELETE` `Frontendemployee/src/app/components/LiveSalaryCounter.tsx:5`
  - Imports `getMyStream` and `type StreamDetails` from `../api`, but `Frontendemployee/src/app/api.ts` does not export either.
  - This file is currently not imported anywhere, so the broken import is dormant.

- `UNCERTAIN`
  - No other obviously broken imports were found in currently routed backend/frontend entry paths during static audit.

## 12. Duplicate code

- `NEEDS_TESTING` `frontpage/src/blockchain/wallet.ts` and `Frontendemployee/src/blockchain/wallet.ts`
  - Near-duplicate wallet connection helpers.

- `NEEDS_TESTING` `frontpage/src/blockchain/config.ts` and `Frontendemployee/src/blockchain/config.ts`
  - Duplicated chain config and ABI subsets.

- `UNCERTAIN` `frontpage/src/app/components/TowerLoader.tsx` and `Frontendemployee/src/app/components/TowerLoader.tsx`
  - Duplicate loading component implementation across both apps.

- `UNCERTAIN`
  - Style stacks are also duplicated across both frontends: `styles/fonts.css`, `styles/index.css`, `styles/tailwind.css`, `styles/theme.css`.
  - This may be intentional because the apps deploy separately.

## 13. Unused functions

- `SAFE_DELETE` `Backend/service.py:117`
  - `EmployeeService.delete_employee()` is not used; the route performs delete logic directly in `api_routes.py`.

- `SAFE_DELETE` `Backend/security.py:90`
  - `SecurityService.require_employer()` appears unused.

- `SAFE_DELETE` `Backend/security.py:117`
  - `SecurityService.require_employee()` appears unused.

- `SAFE_DELETE` `frontpage/src/app/auth.ts:85`
  - `logoutEverywhere()` appears unused.

- `SAFE_DELETE` `frontpage/src/app/firebase.ts:20`
  - `firebaseAnalyticsPromise` export appears unused.

- `SAFE_DELETE` `frontpage/src/app/api.ts`
  - Confirmed unused helper exports in current UI wiring:
  - `login()`
  - `logout()`
  - `getEmployeeTransactions()`
  - `createTransaction()`
  - `getTotalTax()`
  - `getMonthlySummary()`

- `UNCERTAIN`
  - Some helper exports may be intentionally kept for future phases or manual testing even if not currently referenced by the routed UI.

## 14. Unused files

- `SAFE_DELETE` `Frontendemployee/src/app/components/YieldFeatures.tsx`
  - Not imported anywhere.
  - Contains fake yield-account content unrelated to current payroll flow.

- `SAFE_DELETE` `Frontendemployee/src/app/components/LiveSalaryCounter.tsx`
  - Not imported anywhere.
  - Also contains a broken import, which reinforces that it is currently dead code.

- `UNCERTAIN`
  - No backend Python files look fully unused at the repository level; several are not called by the current frontends but still back existing API routes.

## 15. Unused imports

- `SAFE_DELETE` `Backend/api_routes.py:8`
  - `status` imported from FastAPI but not used.

- `SAFE_DELETE` `Backend/api_routes.py:76`
  - `TaxService` imported from `service.py` but not used directly in this file.

- `SAFE_DELETE` `frontpage/src/app/App.tsx:1`
  - Default `React` import appears unused.

- `SAFE_DELETE` `frontpage/src/pages/Auth/AuthChoice.tsx:1`
  - Default `React` import appears unused.

- `SAFE_DELETE` `frontpage/src/pages/Auth/EmployeeLogin.tsx:1`
  - Default `React` import appears unused.

- `SAFE_DELETE` `frontpage/src/pages/Auth/EmployerLogin.tsx:1`
  - Default `React` import appears unused.

- `SAFE_DELETE` `frontpage/src/app/components/ProtectedRoute.tsx:1`
  - Default `React` import appears unused.

- `SAFE_DELETE` `frontpage/src/pages/EmployerLayout/Treasury.tsx:1`
  - Default `React` import appears unused.

- `SAFE_DELETE` `frontpage/src/pages/EmployerLayout/Settings.tsx:1`
  - Default `React` import appears unused.

- `SAFE_DELETE` `frontpage/src/pages/EmployerLayout/Layout/EmployeeDetails.tsx:1`
  - Default `React` import appears unused.

- `SAFE_DELETE` `Frontendemployee/src/app/components/YieldFeatures.tsx:1`
  - Default `React` import appears unused.

## 16. Commented-out code

- `SAFE_DELETE` `Backend/service.py:262-263`
  - APScheduler placeholder commented-out job registration.

- `UNCERTAIN`
  - Most other comments are structural section headers or explanatory comments, not commented-out code.

## 17. Console/debug logs

- `SAFE_FIX` `Backend/main.py:107`
  - `print("Test employee user created")`
- `SAFE_FIX` `Backend/main.py:118`
  - `print("Test employer user created")`
- `SAFE_FIX` `Backend/main.py:129`
  - `print("Demo employee user created")`
- `SAFE_FIX` `Backend/main.py:140`
  - `print("Demo admin user created")`
- `SAFE_FIX` `Backend/main.py:152`
  - `print("Test employee created")`
- `SAFE_FIX` `Backend/main.py:164`
  - `print("Demo employee created")`
- `SAFE_FIX` `Backend/main.py:170`
  - `print("Startup complete (database disabled: DATABASE_URL not set)")`
- `SAFE_FIX` `Backend/main.py:192`
  - `print("Treasury initialized")`
- `SAFE_FIX` `Backend/main.py:197`
  - `print("Company settings initialized")`
- `SAFE_FIX` `Backend/main.py:201`
  - `print("Startup complete")`

- `SAFE_FIX` `frontpage/src/pages/EmployerLayout/Employees.tsx:27`
  - `console.error(err)`

- `SAFE_FIX` `frontpage/src/pages/EmployerLayout/Overview.tsx:46`
  - `console.error("Dashboard fetch error:", err)`

- `UNCERTAIN`
  - `deploy/scripts/deploy.js` uses console logging heavily, but that is normal for deployment scripting rather than app-runtime debug noise.

## 18. Mock/fake data still used

- `NEEDS_TESTING` `Backend/main.py:97-164` and `Backend/main.py:181-182`
  - Demo/test user and employee seed data still exists behind `ENABLE_DEMO_SEED`.
  - Includes `employee@test.com`, `employer@test.com`, `employee@krackheads.com`, `admin@krackheads.com`.

- `NEEDS_TESTING` `frontpage/src/pages/Auth/AutoLogin.tsx:16-19`
  - Auto-login page falls back to hardcoded demo credentials if env vars are missing.

- `NEEDS_TESTING` `frontpage/src/pages/Auth/EmployerLogin.tsx:53-97`
  - Demo employer login path still wired in when env vars exist.

- `NEEDS_TESTING` `frontpage/src/pages/Auth/EmployeeLogin.tsx:75-90`
  - Demo employee login path still wired in when env vars exist.

- `SAFE_DELETE` `Frontendemployee/src/app/components/YieldFeatures.tsx`
  - Entire file is mock/fake data and appears unused.

- `SAFE_FIX` `frontpage/src/app/components/Footer.tsx:51`
  - Footer still describes the product as a “demo”.

## 19. Debug-only routes or pages

- `NEEDS_TESTING` `frontpage/src/pages/Auth/AutoLogin.tsx` and `frontpage/src/app/App.tsx:65`
  - `/auto-login` looks like a debug/demo shortcut page rather than a normal production auth flow.

- `UNCERTAIN`
  - No obviously debug-only backend routes were found, but several admin/ops routes are currently unused by the frontends.

## 20. Code that looks unused but is risky to delete

- `RISKY_DO_NOT_TOUCH` `Backend/api_routes.py`
  - These routes are not currently consumed by obvious frontend helpers, but they back phase/system capabilities and may be part of manual flows or planned integration:
  - `/api/payroll/intents*`
  - `/api/blockchain/sync-events`
  - `/api/admin/logs`
  - `/api/reports/monthly`
  - `/api/reports/employees/{employee_id}`
  - `/api/reports/tax`
  - `/api/notifications/email`
  - `/api/notifications`
  - `/api/streams/history`
  - `/api/treasury/health`
  - `/api/treasury/summary`
  - `/api/treasury/sync`
  - `/api/me/stream`
  - `/api/streams/{employee_id}`

- `RISKY_DO_NOT_TOUCH` `Backend/stream_chain.py`
  - Looks lightly wired today because the employee frontend reads chain state directly in `App.tsx`, but backend routes still import and use it.

- `RISKY_DO_NOT_TOUCH` `Backend/main.py:38-94`
  - Startup schema-alter helpers look crude, but removing them without a migration plan could break existing local/prod databases.

- `RISKY_DO_NOT_TOUCH` `frontpage/src/blockchain/config.ts` and `Frontendemployee/src/blockchain/config.ts`
  - Duplicated, but contract ABI drift here would directly affect wallet/payroll flows.

## Summary

Highest-signal cleanup candidates that do not appear to change behavior:
- Remove clearly unused imports.
- Remove or quarantine `YieldFeatures.tsx`.
- Remove or quarantine `LiveSalaryCounter.tsx` after confirming it is not planned for reintroduction.
- Remove commented-out APScheduler code.
- Replace runtime `console`/`print` noise with proper logging later.

Highest-signal bug candidates to verify before any cleanup:
- Employee profile name mismatch in employee UI.
- Invalid PDF export implementation.
- Treasury sync using placeholder on-chain balance.
- Demo/auto-login paths and demo seed data still present.
- Bonus tax preview mismatch against backend tax logic.
