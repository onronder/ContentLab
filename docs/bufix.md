build errors

##[debug]Evaluating condition for step: 'Install dependencies'
##[debug]Evaluating: success()
##[debug]Evaluating success:
##[debug]=> true
##[debug]Result: true
##[debug]Starting: Install dependencies
##[debug]Loading inputs
##[debug]Loading env
Run pnpm install
##[debug]/usr/bin/bash -e /home/runner/work/_temp/f80963eb-1179-4419-8e93-6bb2e9f238a0.sh
 WARN  The "workspaces" field in package.json is not supported by pnpm. Create a "pnpm-workspace.yaml" file instead.
 ERR_PNPM_OUTDATED_LOCKFILE  Cannot install with "frozen-lockfile" because pnpm-lock.yaml is not up to date with <ROOT>/package.json

Note that in CI environments this setting is true by default. If you still need to run install in such cases, use "pnpm install --no-frozen-lockfile"



lint errors

##[debug]Evaluating condition for step: 'Lint'
##[debug]Evaluating: success()
##[debug]Evaluating success:
##[debug]=> true
##[debug]Result: true
##[debug]Starting: Lint
##[debug]Loading inputs
##[debug]Loading env
Run npm run lint
##[debug]/usr/bin/bash -e /home/runner/work/_temp/1cc8c56b-0e35-43a4-ab2a-31c3f3869893.sh

> content-roadmap-tool@0.1.0 lint
> next lint

Attention: Next.js now collects completely anonymous telemetry regarding usage.
This information is used to shape Next.js' roadmap and prioritize features.
You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
https://nextjs.org/telemetry


./src/app/admin/quota-management/page.tsx
56:46  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
57:66  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
58:48  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any

./src/components/JobMonitor.tsx
196:6  Warning: React Hook useCallback has an unnecessary dependency: 'supabase'. Either exclude it or remove the dependency array. Outer scope values like 'supabase' aren't valid dependencies because mutating them doesn't re-render the component.  react-hooks/exhaustive-deps
218:6  Warning: React Hook useCallback has an unnecessary dependency: 'supabase'. Either exclude it or remove the dependency array. Outer scope values like 'supabase' aren't valid dependencies because mutating them doesn't re-render the component.  react-hooks/exhaustive-deps
352:6  Warning: React Hook useEffect has an unnecessary dependency: 'supabase'. Either exclude it or remove the dependency array. Outer scope values like 'supabase' aren't valid dependencies because mutating them doesn't re-render the component.  react-hooks/exhaustive-deps

./src/components/WorkerHealth.tsx
151:6  Warning: React Hook useEffect has an unnecessary dependency: 'supabase'. Either exclude it or remove the dependency array. Outer scope values like 'supabase' aren't valid dependencies because mutating them doesn't re-render the component.  react-hooks/exhaustive-deps

./src/components/admin/UsageAnalytics.tsx
35:3  Error: 'PieChart' is defined but never used.  @typescript-eslint/no-unused-vars
36:3  Error: 'LineChart' is defined but never used.  @typescript-eslint/no-unused-vars
38:3  Error: 'Clock' is defined but never used.  @typescript-eslint/no-unused-vars
65:54  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
165:44  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
165:60  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
165:82  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
167:38  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
189:39  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
297:6  Warning: React Hook useEffect has a missing dependency: 'fetchAnalytics'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
310:62  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
482:63  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
514:109  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
541:113  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
573:98  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any

./src/hooks/useQuotaManagement.ts
138:15  Error: 'data' is assigned a value but never used.  @typescript-eslint/no-unused-vars
189:64  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any

info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/app/api-reference/config/eslint#disabling-rules
Error: Process completed with exit code 1.
##[debug]Finishing: Lint