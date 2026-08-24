# ClientFlow — CRM Application

ClientFlow is a full-stack Customer Relationship Management (CRM) application built from scratch with a custom PHP MVC backend and a React frontend. It helps a sales/support team manage leads, customers, companies, deals, activities, and tasks in one place, backed by a real REST API with JWT authentication.

**Live demo:** [clientflow-ruddy-beta.vercel.app](https://clientflow-ruddy-beta.vercel.app)

---

## 1. Overview

ClientFlow was built as an end-to-end learning and portfolio project: a custom PHP backend (no framework) implementing a REST API with JWT auth, paired with a React + Vite frontend. It covers the full lifecycle of a CRM — from capturing a lead, converting them into a customer, tracking deals and revenue, logging activities, and managing follow-up tasks — with a polished, consistent UI throughout.

## 2. Features

- **Dashboard** with real CRM metrics: total leads, total customers, open/won/lost deals, revenue (sum of won deals), pending tasks, and a recent activities feed — all computed from live data.
- **Leads** — capture, track status through a pipeline (New → Contacted → Qualified → Proposal → Negotiation → Won/Lost), and convert into customers.
- **Customers** — full contact records, linked to companies and deals.
- **Companies** — organizations linked to their customers, with an industry filter.
- **Deals** — sales opportunities with value, status (Open/Won/Lost), expected close date, and customer/assignment tracking.
- **Activities** — a logged history of calls, meetings, emails, notes, and follow-ups, linkable to a lead, customer, or deal.
- **Tasks** — assignable to-dos with priority, due dates, and status tracking (Pending / In Progress / Done), with inline status updates.
- **Notifications** — in-app notifications surfaced in the top bar.
- **Search** across every module.
- **Filtering & sorting** tailored per module (status, priority, industry, type, date).
- **Pagination** on all list views.
- **CSV export** on major list pages.
- **Bulk actions** (e.g. bulk delete) on selected records.
- **Robust error handling** — a global backend exception handler that never leaks internal errors to the client, plus a frontend Axios interceptor that automatically signs the user out on an expired/invalid session.
- **Authentication & authorization** — JWT-based login, protected routes, and role-aware middleware.
- **Responsive, consistent UI** — a single shared design language (slide-in detail panels, modals, status pills, tables) reused across every module.

## 3. Screenshots

<!-- Add screenshots here, e.g.: -->
<!-- ![Dashboard](./docs/screenshots/dashboard.png) -->
<!-- ![Leads list](./docs/screenshots/leads.png) -->
<!-- ![Deal detail panel](./docs/screenshots/deal-detail-panel.png) -->

*(Screenshots of the Dashboard, a list page, and a detail panel go here.)*

## 4. Tech Stack

**Frontend**
- React
- Vite
- React Router
- Axios
- Lucide React (icons)
- Plain CSS (component-scoped stylesheets, no framework)

**Backend**
- PHP (custom MVC architecture, no framework)
- REST API
- JWT authentication (`firebase/php-jwt`)
- Custom middleware pipeline (auth, role-based)
- MySQL / MariaDB

**Testing**
- PHPUnit (backend unit tests)
- End-to-end tests exercising real user flows against a running instance

**Deployment**
- Frontend: Vercel
- Backend: Railway
- Database: managed MySQL (Railway MySQL)

## 5. Architecture

ClientFlow follows a classic client–server split:
┌─────────────────┐ REST API (JSON) ┌──────────────────┐
│ React (Vite) │ <-----------------------------> │ PHP MVC backend │
│ Frontend │ JWT in Authorization │ (custom router) │
└─────────────────┘ header └──────────────────┘
│
▼
┌──────────────────┐
│ MySQL / MariaDB │
└──────────────────┘ 

**Backend request flow:** `public/index.php` sets CORS headers, registers a global exception handler, then hands off to a custom `Router` that matches the HTTP method + path, runs any configured middleware (e.g. `AuthMiddleware` to verify the JWT), and dispatches to the matching `Controller` method. Controllers talk to `Model` classes, which use PDO for all database access.

**Frontend structure:** Each CRM module (Leads, Customers, Companies, Deals, Activities, Tasks) follows the same pattern — a list page with search/filter/sort/pagination, a creation modal, and a slide-in detail panel supporting view/edit/delete. A shared `api.js` Axios instance handles auth token attachment and automatic session-expiry handling.

## 6. Project Structure
ClientFlow/
├── backend/
│ ├── app/
│ │ ├── Controllers/ # One controller per resource (Lead, Customer, Deal, ...)
│ │ ├── Models/ # Data access layer (PDO-based)
│ │ ├── Middleware/ # AuthMiddleware, RoleMiddleware
│ │ └── Core/ # Router, Database, Controller base class, ErrorHandler, JwtHelper
│ ├── routes/ # API route definitions
│ ├── public/ # Entry point (index.php)
│ ├── tests/ # PHPUnit test suite
│ └── storage/logs/ # Application error logs
│
└── frontend/
└── src/
├── pages/ # One page per module (Leads.jsx, Deals.jsx, ...)
├── components/ # Modals, detail panels, shared UI (StatusPill, etc.)
├── api/ # Axios instance + interceptors
├── context/ # AuthContext
└── routes/ # ProtectedRoute

## 7. Database

The schema is fully relational, with foreign keys and `ON DELETE SET NULL` used throughout so that deleting a parent record (e.g. a company) never destroys historical data (e.g. its customers just become unlinked, not deleted).

**Core tables:** `users`, `leads`, `customers`, `companies`, `deals`, `activities`, `tasks`, `notifications`, `audit_logs`.

Key relationships:
- A **company** has many **customers**.
- A **customer** has many **deals** (a deal always belongs to exactly one customer).
- **Activities** and **tasks** can each be linked to *one* of a lead, customer, or deal (enforced at both the database and application level) — never more than one at a time.
- Every **activity** records which **user** created it, taken automatically from the authenticated session rather than being user-selectable.

## 8. API Overview

All endpoints are prefixed with `/api` and (aside from `/login` and `/register`) require a valid JWT in the `Authorization: Bearer <token>` header.

| Resource | Endpoints |
|---|---|
| Auth | `POST /register`, `POST /login` |
| Leads | `GET /leads`, `GET /leads/{id}`, `POST /leads`, `PUT /leads/{id}`, `DELETE /leads/{id}` |
| Customers | `GET /customers`, `GET /customers/{id}`, `POST /customers`, `PUT /customers/{id}`, `DELETE /customers/{id}` |
| Companies | `GET /companies`, `GET /companies/{id}`, `POST /companies`, `PUT /companies/{id}`, `DELETE /companies/{id}` |
| Deals | `GET /deals`, `GET /deals/{id}`, `POST /deals`, `PUT /deals/{id}`, `DELETE /deals/{id}` |
| Activities | `GET /activities`, `GET /activities/{id}`, `POST /activities`, `PUT /activities/{id}`, `DELETE /activities/{id}` |
| Tasks | `GET /tasks`, `GET /tasks/{id}`, `POST /tasks`, `PUT /tasks/{id}`, `DELETE /tasks/{id}` |

Most list endpoints (`GET` collection routes) support a common set of query parameters where relevant: `search`, `sort`, `page`, `limit`, plus resource-specific filters (e.g. `status`, `priority`, `type`, `industry`).

All error responses share a consistent shape:
```json
{ "error": "Human-readable message here" }
```

> A full endpoint-by-endpoint reference (request/response bodies, query parameters) may be split out into a separate `API.md` if this section grows too large to keep in the main README.

## 9. Authentication & Authorization

- Login issues a signed JWT (via `firebase/php-jwt`) containing the user's ID and role, with a limited expiry.
- Every protected route runs through `AuthMiddleware`, which validates the token and makes the authenticated user available to controllers via a simple `Auth` helper (`Auth::id()`, `Auth::role()`).
- A `RoleMiddleware` exists and is wired into the router (supporting syntax like `RoleMiddleware:Admin,Manager`) for restricting specific routes by role.
- On the frontend, an Axios response interceptor watches for `401` responses — on an expired or invalid token, it automatically clears the stored session and redirects the user to `/login`, so a stale session never leaves the user stuck on a broken page.

## 10. Local Setup

**Prerequisites:** PHP 8.2+, Composer, Node.js, MySQL/MariaDB.

**Backend:**
```bash
cd backend
composer install
cp .env.example .env   # then fill in your local DB credentials and a JWT secret
php -S localhost:8000 -t public
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

The frontend expects the backend at `http://localhost:8000/api` by default (see Environment Variables below).

## 11. Environment Variables

**Backend (`backend/.env`):**

| Variable | Description |
|---|---|
| `DB_HOST` | Database host |
| `DB_PORT` | Database port (typically `3306`) |
| `DB_NAME` | Database name |
| `DB_USER` | Database username |
| `DB_PASS` | Database password |
| `JWT_SECRET` | Secret key used to sign and verify JWTs |

**Frontend (`frontend/.env`):**

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API (e.g. `http://localhost:8000/api` locally, or the deployed backend URL in production) |

## 12. Deployment

ClientFlow is deployed as two independently-hosted services:

- **Frontend** — deployed on **Vercel**, built from the `frontend/` directory (Vite preset), with `VITE_API_URL` set as an environment variable pointing at the production backend.
- **Backend** — deployed on **Railway**, running the PHP application against a managed MySQL database also hosted on Railway.
- Both services **auto-deploy on every push to `main`**, giving the project continuous deployment out of the box.
- CORS is handled explicitly in the backend entry point via an origin allowlist, so only the known frontend origins (local dev and the production Vercel domain) are permitted to call the API.

## 13. Testing

- **Backend:** unit tests written with PHPUnit, covering core business logic (validation rules, status transitions, and the mutual-exclusivity relationship rules enforced on activities and tasks).
- **End-to-end:** automated tests exercising real user flows against a running instance of the application.

## 14. Future Improvements

- Expand automated test coverage (component-level frontend tests, broader integration tests).
- Formal CI pipeline (e.g. GitHub Actions) running the test suite on every pull request before deploy.
- Role-based UI restrictions to match the backend's existing `RoleMiddleware` support.
- Split out a dedicated `API.md` with full request/response examples per endpoint.

## 15. Author

**Souha Nekamiche**

---

## License

This project is licensed under the [MIT License](./LICENSE).
