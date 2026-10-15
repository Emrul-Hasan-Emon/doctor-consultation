# Admin web guide

Read before writing a page. Next.js here is **16** (App Router, React 19, Tailwind 4). It has breaking changes: when unsure, read `web/node_modules/next/dist/docs/01-app/`. Notable: `middleware` is now `proxy.ts`; `params` and `searchParams` in pages are Promises; `cookies()` is async.

## How the portal works
- The browser never holds tokens. Login (`/api/auth/login`) sets httpOnly cookies. Every API call goes through the same-origin proxy `src/app/api/backend/[...path]` which adds the bearer token, refreshes it when expired and retries once.
- Call the backend from client components only: `api<T>('admin/doctor', { query })` from `@/lib/api` (path is relative to `/api`). It throws `ApiError` (`status`, `messages[]`); `errorMessage(e)` gives a string. A 401 redirects to login.
- Data fetching and mutations use TanStack Query (`useQuery`, `useMutation`, `queryClient.invalidateQueries`). Query keys: `['doctors', params]`, `['doctor', id]`, etc. After a mutation, invalidate the list and the item keys.
- Types for every response are in `@/lib/types` (mirror `docs/api/admin-api-contract.md`). If the real API differs from a type, say so in your final message; do not silently work around it.

## Layout of code
- Route files stay thin: `src/app/admin/(dashboard)/<route>/page.tsx` is a server component that exports `metadata` and renders a client view. Params: `export default async function Page({ params }: { params: Promise<{ id: string }> })`.
- Feature code lives in `src/features/<feature>/` (views, forms, hooks, columns). Do not put feature code in `components/ui`.
- Use the existing kit and helpers, do not re-create them: `@/components/ui/*` (Button, Input, Textarea, Select, Field, Card, Badge, StatusBadge, ActiveBadge, DataTable, Pagination, SearchInput, Modal, ConfirmDialog, Tabs, DescriptionList, PageHeader, EmptyState, Spinner, toast via `useToast()`), `@/components/forms/*` (AsyncSelect, AsyncMultiSelect, BilingualRow, FormError, `useDivisions`, `useDistricts`), `@/lib/format`, `@/lib/use-list-params` (URL-synced page, search and filters), `@/lib/types`.
- **Do not edit** shared files (`components/ui`, `components/forms`, `components/layout`, `lib/*`, `app/api/*`, `proxy.ts`) or another feature's folder. Need a shared change? Work around it locally and report it. You may add new files inside your own feature folder.

## Conventions
- Every list page: title + primary action, filters (SearchInput + selects) synced to the URL with `useListParams`, `DataTable` inside a `Card`, `Pagination`, empty and error states, row click or link to details.
- Every form: `react-hook-form` + `zod` (`zodResolver`). Mobile fields accept free text (the server normalizes). Required fields marked. Bilingual pairs side by side with `BilingualRow` (English label `Name`, Bengali `Name (Bangla)`). Empty optional strings are sent as `null`/omitted, never `""` for numbers or ids. Show `FormError` for server errors and a success toast, then navigate or close. Disable submit while pending.
- Destructive or irreversible actions use `ConfirmDialog` and say what happens.
- Show server 409/400 messages to the user as returned.
- Accessibility: labelled controls (use `Field`), buttons for actions, links for navigation, `aria-label` on icon-only buttons.
- Money with `formatMoney`, dates with `formatDate`, times with `formatTime` (display) and `toInputTime` (time inputs). Dates sent to the API are `YYYY-MM-DD`, times `HH:mm`.
- No `any`. No new dependencies. Tailwind utility classes only, same look as the kit (teal accent, zinc neutrals).
- Navigation items already exist in the sidebar.

## Verify (several agents work at once: do NOT run `next build`, `next dev` or `next start`: they share `.next`)
- `cd web && npx tsc --noEmit` and `npx eslint "src/features/<yours>/**" "src/app/admin/**"` must be clean for your files.
- The backend may still be under construction by other agents. Build against `docs/api/admin-api-contract.md`. If a backend at `http://localhost:3001` is running you can check the real shapes with curl (login `01700000000` / `ChangeMe123!` at `/api/auth/admin/login`), but do not start, stop or restart it yourself.

## Final message
Files created, routes (URL paths) delivered, contract mismatches or missing backend behaviour you noticed, anything not verified. Keep it short.
