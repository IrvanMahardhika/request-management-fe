# Request Management Frontend

Vue 3 + Vite single-page application for the Hyperoptimum Request Desk — an operational request management system with role-scoped workflows across platform → country → territory → site.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Vue 3.5 (Composition API, `<script setup>`) |
| Router | Vue Router 4 (history mode) |
| Build | Vite 8 |
| Language | TypeScript 6 |
| Testing | Vitest 4 + jsdom + @vue/test-utils |
| Styling | Scoped CSS + global design tokens |

**Node:** `^22.18.0 || >=24.12.0`

## Quick Start

```sh
npm install
npm run dev
```

The dev server runs on `http://localhost:5173` and proxies API calls to `http://localhost:3001`.

Ensure the Request Management API is running locally before using the app (see `request-management-api/docs/README.md` in the monorepo).

### Seeded Logins

Use accounts from the API seed (password `Password123!`), for example:

- `staff1@example.com` — Staff Member
- `tm.east@example.com` — Territory Manager
- `admin@example.com` — Platform Admin

## Project Structure

```
src/
├── main.ts                # App bootstrap
├── App.vue                # Root RouterView
├── types.ts               # PublicUser, OperationalRequest, PermissionCode, RoleCode
├── router/index.ts        # Routes + auth guard
├── composables/
│   └── useAuth.ts         # Auth state and actions
├── lib/
│   ├── auth.ts            # localStorage session + permission check
│   └── api.ts             # fetch wrapper with Bearer token
├── layouts/
│   └── AppLayout.vue      # Sidebar shell + permission-based nav
├── views/                 # Page components
├── assets/
│   └── main.css           # Global styles and design tokens
└── test/                  # Test setup and helpers
```

## Routes & Views

| Route | View | Description |
|-------|------|-------------|
| `/login` | `LoginView` | Public login form |
| `/` | `DashboardView` | Filterable list of operational requests |
| `/requests/new` | `RequestCreateView` | Submit standard-priority request |
| `/requests/new-on-behalf` | `RequestOnBehalfView` | Submit request on behalf of site staff |
| `/requests/:id` | `RequestDetailView` | Request detail and workflow actions |
| `/users` | `UsersView` | List users, deactivate accounts |
| `/users/new` | `UserCreateView` | Create user with role and org scope |
| `/reports/platform` | `ReportView` | Platform-level report |
| `/reports/country` | `ReportView` | Country-level report |
| `/reports/territory` | `ReportView` | Territory-level report |
| `/reports/site` | `ReportView` | Site-level report |

All routes except `/login` are nested under `AppLayout` and require authentication.

### Router Guard

- Calls `bootstrap()` on first navigation to validate the token via `/auth/me`
- Authenticated users visiting `/login` are redirected to the dashboard
- Protected routes without a token redirect to `/login?redirect=<path>`

Routes are not permission-gated at the router level. Permission enforcement happens in the sidebar navigation and request detail actions.

## Authentication

### Session Storage (`src/lib/auth.ts`)

Session is stored in `localStorage`:

- `rm_token` — JWT
- `rm_user` — serialized user object

Exports: `getToken()`, `getStoredUser()`, `setSession()`, `clearSession()`, `hasPermission(user, code)`.

### API Client (`src/lib/api.ts`)

- Base URL: `import.meta.env.VITE_API_BASE_URL` (empty in dev uses Vite proxy)
- Attaches `Authorization: Bearer <token>` when present
- On **401**: clears session and redirects to `/login`
- Throws `ApiError` with status and message on failure

### Auth Composable (`src/composables/useAuth.ts`)

| Method / Property | Description |
|-------------------|-------------|
| `bootstrap()` | Validates token via `GET /auth/me` |
| `login(email, password)` | `POST /auth/login` → stores token and user |
| `logout()` | Clears session |
| `can(code)` | Checks if user has a permission |
| `isAuthenticated` | Computed: token and user both present |

### Auth Flow

```
Login → POST /auth/login → setSession(token, user)
       ↓
Router beforeEach → bootstrap() → GET /auth/me
       ↓
All API calls → Bearer token in header
       ↓
401 response → clearSession() → redirect to /login
```

## Role-Based UI

Authorization is permission-based. The sidebar and request actions show or hide based on the user's permissions.

### Roles

`platform_admin`, `country_ops_manager`, `territory_manager`, `site_manager`, `staff_member`

### Sidebar Navigation

| Permission | Nav Item |
|------------|----------|
| `submit_standard_priority_request` | New request |
| `submit_standard_priority_request_on_behalf_of_the_staff` | On behalf |
| `view_user` | Users |
| `platform_reporting` | Platform report |
| `country_reporting` | Country report |
| `territory_reporting` | Territory report |
| `site_reporting` | Site report |

The dashboard is always visible. The user's role name and scope type are shown in the sidebar.

### Request Detail Actions

Actions combine permissions, request status, role, and ownership:

| Action | Conditions |
|--------|------------|
| Start review | Has view permission for priority; status is `submitted` or `additional_info_provided`, or escalated to TM/COM and user holds that role |
| Approve / Decline | Status `under_review`, not own request, has approve/decline permission for priority |
| Request info | Status `under_review`, has request-info permission |
| Provide info | Status `additional_info_requested`; requester or site staff/manager at same site |
| Escalate to TM | Standard priority, `under_review`, has escalate permission |
| Escalate to COM | `under_review`, has escalate permission |
| Resolve | Status `approved`, has `resolve_request` |
| Audit / history | Has `view_request_history` |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | API base URL baked in at build time. Local `.env` sets `http://localhost:3001`. Empty string uses relative paths and the dev proxy. |

## Vite Configuration

- **Alias:** `@` → `./src`
- **Dev server:** port `5173`
- **Proxy** to `http://localhost:3001`: `/auth`, `/users`, `/org`, `/requests`, `/reports`, `/health`
- **Vitest:** jsdom, 40% coverage thresholds

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Dev server with HMR |
| `build` | `npm run build` | Type-check + production build |
| `build-only` | `npm run build-only` | Build only |
| `type-check` | `npm run type-check` | TypeScript validation |
| `preview` | `npm run preview` | Preview production build |
| `test` | `npm test` | Run tests once |
| `test:watch` | `npm run test:watch` | Watch mode |
| `test:coverage` | `npm run test:coverage` | Coverage report |

## Deployment

Push to `master` triggers `.github/workflows/deploy-s3.yml`:

1. Checkout → Node 22 → `npm ci`
2. `npm run test:coverage`
3. `npm run build` with `VITE_API_BASE_URL` from GitHub vars
4. `aws s3 sync dist/` → S3 bucket (long cache for assets, `index.html` uploaded separately with no-cache)
5. CloudFront invalidation `/*`

### GitHub Configuration

**Vars:** `VITE_API_BASE_URL`, `AWS_REGION`, `S3_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`, `CLOUDFRONT_DOMAIN`

**Secrets:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

## Related

- Request Management API — see `request-management-api/docs/README.md` in the monorepo
