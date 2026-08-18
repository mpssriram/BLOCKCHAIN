# PayStream Project Review

Review date: 2026-08-18

Scope: backend, both React frontends, local launcher, Streamlit folder, and current uncommitted work. The initial review made no code changes; the implementation status below records the approved follow-up work.

## Implementation status

The following findings from this review have now been addressed:

- Production startup rejects a default or short JWT secret.
- Only administrators can provision users, and the API cannot create an admin role.
- Payroll-intent endpoints require dashboard access.
- The employee portal now uses a one-time, 60-second handoff code instead of a JWT in the URL; the open `SetToken` route is removed.
- Approval and administrator-created employee accounts receive a matching employee profile.
- Deactivation increments session version and blocks employee sign-in/API access; password reset also revokes active sessions.
- Approval and password-reset email work is queued after the database commit, SMTP has a timeout, and access-request attempts have a per-process rate limit.
- Google sign-in is hidden until Firebase is configured, fixed Vite ports are enforced, the unavailable treasury-sync control is removed, and the README merge conflicts are replaced with current instructions.
- Streamlit source files are removed from Git. The untracked local `streamlit_app/venv` and cache directory still need a manual local deletion because this environment blocks recursive deletion commands.
- `Backend/test_auth_security.py` now covers the repaired authorization, approval, handoff, and deactivation paths and runs from `check_project.py`.

Remaining improvements: split the large frontend bundles and migrate the remaining naive UTC timestamps before a future Python release requires it.

## Findings

### P0 - Fix before any real deployment

1. **JWTs can be forged when `SECRET_KEY` is omitted.**
   - `Backend/config.py:15` supplies the publicly known default `CHANGE-ME-IN-PRODUCTION`.
   - `Backend/security.py:21` uses that value without refusing to start in production.
   - Result: a deployment with a missing environment variable accepts attacker-created admin JWTs. Production startup must fail unless a sufficiently strong, non-default secret is configured.

2. **An employer can create an admin account through the public API.**
   - `Backend/auth.py:132-147` lets any dashboard user call `/api/register` and copies the request role directly into a new `User`.
   - `Backend/schemas.py:160-163` accepts any string as the role.
   - Result: an employer can submit `role=admin` and self-escalate. Restrict this endpoint to admins and strictly validate allowable roles.

### P1 - High risk or a broken core workflow

3. **Any authenticated employee can create, read, or alter payroll intents.**
   - `Backend/api_routes.py:167-183`, `204-228` use `get_current_user`, not dashboard/admin authorization.
   - `Backend/service.py:898-991` has no ownership or role check.
   - Result: an employee can create a payroll action for another employee, enumerate an intent by ID, or attach a transaction hash to it. These endpoints need dashboard-only access, or explicit ownership checks for employee withdrawal intents.

4. **Bearer JWTs are exposed in browser URLs; the legacy token route is also an open redirect.**
   - `frontpage/src/lib/auth.ts:118-132` places the session token in the employee portal query string.
   - `frontpage/src/pages/Auth/SetToken.tsx:9-19` accepts an arbitrary `dest`, stores a supplied token, and redirects to it.
   - `frontpage/src/app/App.tsx:37` keeps this route publicly reachable.
   - Result: tokens can reach browser history, server/proxy logs, analytics, and referrer headers. `SetToken` also enables phishing/open-redirect abuse. Use a same-origin portal, a one-time short-lived exchange code, or a secure server session; remove `SetToken` if it has no approved caller.

5. **Employer approval does not create the employee profile required by the employee portal.**
   - `Backend/auth.py:253-286` creates a `User` only.
   - `Backend/api_routes.py:1000-1012` returns `employee: null` when there is no matching `Employee`; `1071-1079` then rejects wallet updates.
   - Result: the new user can log in after approval but receives an incomplete portal and cannot complete normal self-service. Approval should either create a matching profile or keep the account pending until the employer finishes onboarding.

6. **Deactivating an employee does not disable their account or self-service API access.**
   - `Backend/api_routes.py:390-402` only sets `Employee.is_active = False`.
   - Authentication in `Backend/auth.py:159-228` has no active-status check, and employee APIs in `Backend/api_routes.py:978-1100` do not check it either.
   - Result: a deactivated employee can continue using a valid password/token. Add an account status to `User`, check it at sign-in and on protected employee actions, and revoke active sessions.

### P2 - Important reliability, security-hardening, or developer-experience problems

7. **Email delivery blocks login/reset requests and can be abused to flood approvers.**
   - `Backend/auth.py:184-206` synchronously emails every employer/admin for each new employee email; no IP/email rate limit exists.
   - `Backend/service.py:614-627` opens SMTP with no timeout, on the request thread.
   - Result: an attacker can create many unique requests and mail every approver; a slow mail server can stall login/reset flows. Commit state before queueing email, use a background job with a timeout, and rate-limit by IP and email.

8. **The visible Google sign-in controls are unconfigured by default.**
   - `frontpage/.env.example:9-16` leaves every Firebase value blank.
   - Google buttons are always rendered in `frontpage/src/pages/Auth/EmployerLogin.tsx:251-262` and `frontpage/src/pages/Auth/EmployeeLogin.tsx:217-227`.
   - `frontpage/src/lib/auth.ts:11-16` consequently raises a configuration error.
   - Result: a prominent login option fails on a standard setup. Hide it behind an explicit Firebase-enabled setting until both browser and backend Firebase configuration are present.

9. **The one-command launcher is non-deterministic and creates an unusable clean install.**
   - `dev_all.py:55-60` creates a database with demo seeding disabled.
   - `dev_all.py:86-87` starts both Vite apps without fixed ports; the employee redirect assumes port 5174 in `frontpage/src/lib/auth.ts:118-123`.
   - Result: a fresh installation has no employer who can approve access, and ports can drift whenever 5173 is occupied. Use explicit, strict ports and provide an intentional first-admin bootstrap path for development.

10. **The repository has unresolved merge-conflict markers in the main README.**
    - `README.md:9-13`, `121-123`, `151-154`, `384-409`, and `543-547`.
    - Result: the documentation is unreliable and future merges are harder to audit. Resolve before the next commit.

11. **Treasury sync is exposed but guaranteed to return 501.**
    - `Backend/api_routes.py:635-642` exposes the action.
    - `Backend/service.py:81-86`, `253-263` explicitly raise `NotImplementedError`/501.
    - Result: the dashboard can offer an action that cannot work. Hide it until chain RPC integration is implemented, or implement and test it.

12. **Password changes do not revoke active JWTs.**
    - `Backend/auth.py:392-410` changes only the stored password.
    - `Backend/security.py:51-55`, `94-121` has no token version, revocation list, or session identifier.
    - Result: a stolen access token remains usable until its 60-minute expiry after a password reset. Add a session/version field or server-side revocation.

13. **No automated regression suite covers the new security workflows.**
    - The only tracked automated test is `deploy/test/CorePayroll.test.js`.
    - Current checks compile/build successfully, but they do not test registration roles, approval, OTP expiry/attempts, password-reset revocation, or portal authorization.
    - Result: these workflows can regress silently. Add FastAPI integration tests and browser tests for both login paths before changing them further.

### P3 - Cleanup and maintainability

14. **`streamlit_app/` is dormant duplicate UI code.**
    - Its files are tracked, but it is not launched by `dev_all.py`, is not referenced by either React app, and its own README requires a separate manual command.
    - Recommendation: remove the entire `streamlit_app/` directory only after approving React as the sole UI. It is the clearest folder-size and maintenance reduction.

15. **Legacy demo/token code has no approved production purpose.**
    - `frontpage/src/pages/Auth/SetToken.tsx` is only referenced by the router.
    - `frontpage/src/pages/Auth/AutoLogin.tsx` is only a demo shortcut; `frontpage/src/lib/auth.ts:41-59` exists only for that Firebase email/password demo flow.
    - Recommendation: remove `SetToken` now. Remove `AutoLogin` and `loginWithFirebase` unless demo shortcut sign-in is a deliberate maintained feature.

16. **Dead UI inputs remain after the dashboard text reduction.**
    - `frontpage/src/components/dashboard/DashboardUI.tsx:9-34` and `36-70` accept `description` but never render it.
    - `frontpage/src/pages/Auth/EmployeeLogin.tsx:37`, `79-93`, `210-214` and `frontpage/src/pages/Auth/EmployerLogin.tsx:64`, `102-115` retain `resetMessage`, but reset navigation occurs immediately and no value is set.
    - Recommendation: remove the unused props/call-site values and reset-message state.

17. **Both frontend bundles are noticeably large.**
    - Production build: frontpage JavaScript is 1.35 MB minified (389 KB gzip); employee portal is 882 KB minified (274 KB gzip).
    - Recommendation: code-split dashboard routes and isolate wallet/Web3 dependencies so they are not part of the first paint.

## Keep / Remove Decision List

Keep:
- `Backend/`: the FastAPI API and database models are the active application backend.
- `frontpage/`: active landing page, employer login, reset flow, and employer dashboard.
- `Frontendemployee/`: active employee portal, provided the token-transfer design is replaced.
- `deploy/`: Solidity contract and its test.
- `dev_all.py` and `check_project.py`: useful launch/validation entry points after the fixes above.

Remove after approval:
- `streamlit_app/` (all five tracked files): unused duplicate interface.
- `frontpage/src/pages/Auth/SetToken.tsx` and its route: unused and unsafe.
- `frontpage/src/pages/Auth/AutoLogin.tsx` and `loginWithFirebase`: remove if demo shortcut access is not required.

Archive rather than delete:
- `FUNCTION_FIX_REVIEW.md`, `PORTAL_REGRESSION_REVIEW.md`, and `POST_RESTRUCTURE_REVIEW.md`: useful historical notes, but they are not runtime dependencies.

Do not remove:
- Marketing components referenced by `frontpage/src/pages/Marketing/LandingPage.tsx`; they are active.
- `read_onchain_balance()` by itself; it is a placeholder needed for a future implementation, but its endpoint should be hidden until implemented.

## Verification Performed

- `python check_project.py` passed: Python compilation plus both Vite production builds.
- Both builds emitted chunk-size warnings.
- `git diff --check` found no whitespace errors, but `git grep` confirmed the unresolved README conflict markers above.
- No source code was changed for this review; this document is the only added review artifact.
