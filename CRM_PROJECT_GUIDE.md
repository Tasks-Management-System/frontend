# CRM System — Project Guide & Improvement Roadmap

> A modern HR & Project Management CRM built with React 19, TypeScript, TanStack Query, and Tailwind CSS.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Features & Pages](#4-features--pages)
5. [API Reference](#5-api-reference)
6. [Authentication & Role-Based Access](#6-authentication--role-based-access)
7. [State Management Architecture](#7-state-management-architecture)
8. [Environment Setup](#8-environment-setup)
9. [Current Issues & Bugs to Fix](#9-current-issues--bugs-to-fix)
10. [Improvements Required](#10-improvements-required)
11. [New Features to Add](#11-new-features-to-add)
12. [UI/UX Enhancements](#12-uiux-enhancements)
13. [Performance Optimizations](#13-performance-optimizations)
14. [Security Hardening](#14-security-hardening)
15. [Priority Roadmap](#15-priority-roadmap)

---

## 1. Project Overview

This is a **full-featured CRM (Customer Relationship Management) / HRMS (Human Resource Management System)** for internal company use. It enables teams to manage:

- Employees, roles, and permissions
- Daily attendance (punch-in/out with breaks)
- Leave requests and approvals
- Task management (Kanban, list, and card views)
- Projects overview
- Salary records and PDF payslips
- Calendar with multi-source events
- Sticky notes workspace
- User profiles

**Target Users:** HR, Admin, Managers, Employees  
**Architecture:** SPA (Single Page Application) with a REST API backend  
**Backend URL:** `http://localhost:5051/api/v1` (configurable via `.env`)

---

## 2. Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | React | 19.2.0 |
| Language | TypeScript | 5.9.3 |
| Build Tool | Vite | 7.3.1 |
| Routing | React Router | 7.13.1 |
| Server State | TanStack React Query | 5.87.4 |
| Styling | Tailwind CSS | 4.2.1 |
| Charts | Recharts | 3.8.0 |
| Icons | Lucide React + React Icons | latest |
| Notifications | react-hot-toast | 2.6.0 |
| Auth | Google OAuth (@react-oauth/google) | 0.13.4 |
| JWT Decode | jwt-decode | latest |

---

## 3. Project Structure

```
src/
├── apis/
│   ├── api/
│   │   ├── attendance.ts      # Punch in/out, breaks, history
│   │   ├── auth.ts            # Login, signup, user CRUD, profile
│   │   ├── leave.ts           # Apply, approve, reject leaves
│   │   ├── notes.ts           # Sticky notes CRUD
│   │   ├── projects.ts        # Project list and creation
│   │   ├── salary.ts          # Salary records and PDF
│   │   └── tasks.ts           # Task CRUD with filters
│   ├── apiPath.ts             # Centralized API route constants
│   └── apiService.ts          # HTTP client with auth + error handling
│
├── components/
│   ├── UI/                    # Reusable primitives (Button, Input, Table, Modal…)
│   ├── auth/
│   │   └── RoleRouteGuard.tsx # Role-based route enforcement
│   ├── calendar/              # 12 calendar sub-components
│   ├── header/                # Top navigation bar
│   ├── layout/
│   │   └── DashboardLayout.tsx
│   ├── leave/                 # Leave history + balance components
│   └── sidebar/               # Navigation sidebar
│
├── pages/
│   ├── attendance/
│   ├── auth/                  # Login, SignUp
│   ├── calendar/
│   ├── dashboard/             # Admin overview with charts
│   ├── leave/
│   ├── notes/
│   ├── profile/               # Personal profile editor
│   ├── salary/
│   ├── settings/
│   ├── tasks/
│   └── userProfile/           # Public user view
│
├── types/                     # TypeScript interfaces for all entities
├── utils/                     # Auth helpers, media URL, task utils
├── hooks/                     # Custom React hooks
├── constants/                 # Task statuses, etc.
├── App.tsx                    # Route configuration
└── main.tsx                   # App entry + providers
```

---

## 4. Features & Pages

### Pages & Routes

| Route | Page | Access | Description |
|-------|------|--------|-------------|
| `/login` | Login | Public | Email/password + Google OAuth |
| `/signup` | SignUp | Public | User registration |
| `/` | Dashboard | All roles | Admin stats, charts, quick actions |
| `/tasks` | Tasks | All roles | Kanban / List / Cards view |
| `/notes` | Sticky Notes | All roles | Canvas-style sticky notes |
| `/attendance` | Attendance | All roles | Punch in/out, breaks, summaries |
| `/leave` | Leave | All roles | Apply + approve leave requests |
| `/calendar` | Calendar | All roles | Month/Week/Day/Agenda views |
| `/salary` | Salary | Admin, HR | Salary records + PDF download |
| `/employee` | Employees | Admin, HR | Employee directory + management |
| `/settings` | Settings | Admin, HR | App configuration |
| `/profile` | My Profile | All roles | Edit personal information |
| `/user/:id` | User Profile | All roles | View any employee's profile |
| `/projects` | Projects | All roles | Project overview |

### Role System

| Role | Access Level |
|------|-------------|
| `super-admin` | Full access to everything |
| `admin` | All features except super-admin only areas |
| `hr` | Salary, leave approval, employee management |
| `manager` | Team tasks, leave approval for team |
| `employee` | Own tasks, attendance, leave, notes |

---

## 5. API Reference

**Base URL:** `VITE_API_BASE_URL` (default: `http://localhost:5051/api/v1`)

### Authentication
```
POST   /auth/login              # Login with email & password
POST   /auth/register           # Register new user
POST   /auth/logout             # Logout
POST   /auth/refresh-token      # Refresh JWT
GET    /auth/google             # Google OAuth start
GET    /auth                    # List all users (admin)
GET    /auth/{id}               # Get user by ID
PUT    /auth/{id}               # Update user
DELETE /auth/{id}               # Delete user
POST   /auth/create-user        # Admin creates user
```

### Tasks
```
GET    /task                    # List tasks (paginated + filterable)
POST   /task/create             # Create task
GET    /task/{id}               # Get task
PUT    /task/{id}               # Update task
GET    /task/query/{id}         # Task queries/comments
POST   /task/reply/{id}         # Reply to task
```

### Attendance
```
POST   /attendance/punch-in     # Clock in
POST   /attendance/punch-out    # Clock out
POST   /attendance/start-break  # Start break
POST   /attendance/end-break    # End break
GET    /attendance              # Attendance history
```

### Leave
```
GET    /leave                   # Leave history
GET    /leave/pending           # Pending requests (HR/admin)
POST   /leave/apply             # Apply for leave
GET    /leave/{id}              # Get leave details
PUT    /leave/{id}              # Approve or reject leave
```

### Salary
```
GET    /salary                  # List salary records
POST   /salary/create           # Create salary record
GET    /salary/{id}             # Get salary by ID
GET    /salary/pdf/{id}         # Download PDF payslip
```

### Projects
```
GET    /project                 # List projects
POST   /project/create          # Create project
GET    /project/{id}            # Get project details
```

### Notes
```
GET    /notes                   # List sticky notes
POST   /notes/create            # Create note
GET    /notes/{id}              # Get note
PATCH  /notes/{id}              # Update note (title, content, position, color)
```

### Events/Calendar
```
GET    /events                  # List all events
GET    /events/team             # Team events
GET    /events/{id}             # Get event details
```

### Hiring
```
GET    /hiring                  # List hiring records
POST   /hiring/create           # Create hiring record
GET    /hiring/{id}             # Get hiring record
PUT    /hiring/update/{id}      # Update hiring record
DELETE /hiring/{id}             # Delete hiring record
```

---

## 6. Authentication & Role-Based Access

### Login Flow

```
Email/Password Login:
  User → POST /auth/login → JWT token
  → Store token, userId, roles in localStorage
  → Redirect to Dashboard

Google OAuth:
  User → Click "Google" → Redirect /auth/google (backend)
  → Backend OAuth → Redirect to frontend with ?token=JWT
  → Decode JWT → Store token, userId, roles
  → Redirect to Dashboard
```

### Session Management

- JWT stored in `localStorage` under key `token`
- All API requests send: `Authorization: Bearer <token>`
- On `403 ACCOUNT_INACTIVE` → clear session → redirect `/login?reason=account_inactive`
- Token refresh endpoint available at `/auth/refresh-token`

### Route Guard Flow

```
Navigate to /salary
  → DashboardLayout checks: token exists? No → /login
  → RoleRouteGuard checks: userRole in allowedRoles? No → /
  → Page renders
```

---

## 7. State Management Architecture

### Pattern: React Query + Local State

```
User Action
  └─► useState (form, modal, pagination)
      └─► useMutation (API call)
          └─► Query Cache invalidation
              └─► useQuery refetches automatically
                  └─► Component re-renders
                      └─► Toast notification
```

### Key Query Patterns

```typescript
// Paginated query
const { data } = useQuery({
  queryKey: ["tasks", page, limit, filters],
  queryFn: () => fetchTasks({ page, limit, ...filters }),
  keepPreviousData: true   // smooth pagination
})

// Auto-refetch for live data
const { data } = useQuery({
  queryKey: ["attendance"],
  queryFn: fetchAttendance,
  refetchInterval: 60_000  // every 60 seconds
})

// Mutation with cache update
const mutation = useMutation({
  mutationFn: createTask,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] })
})
```

---

## 8. Environment Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend server running on port 5051

### Installation

```bash
# Clone repo
git clone <repo-url>
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

### Environment Variables

```env
VITE_API_BASE_URL=http://localhost:5051/api/v1
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### Available Scripts

```bash
npm run dev        # Start dev server (port 5173)
npm run build      # Production build
npm run preview    # Preview production bundle
npm run lint       # Run ESLint
```

---

## 9. Current Issues & Bugs to Fix

### High Priority

- [ ] **Token key inconsistency** — Code checks `accessToken`, `token`, and `authToken` in multiple places. Standardize to one key throughout the codebase.
- [ ] **No token refresh mechanism** — JWT expiry is not handled automatically. Users get silently logged out or see API errors. Implement auto-refresh using the `/auth/refresh-token` endpoint.
- [ ] **Roles stored in localStorage** — User roles cached in `localStorage` can be tampered with client-side. Always re-validate roles from the server on sensitive operations.
- [ ] **Missing `.env.example` file** — New developers don't know what environment variables are required.
- [ ] **Large page files** — `Tasks.tsx` is 620+ lines. Split into sub-components for maintainability.

### Medium Priority

- [ ] **No error boundaries** — An uncaught error in one component crashes the entire app. Add React `ErrorBoundary` wrappers around major sections.
- [ ] **No loading state on route transitions** — Navigation feels abrupt. Add a top-progress-bar (e.g., NProgress).
- [ ] **Attendance elapsed time calculated client-side** — If user's device clock is wrong, worked hours will be incorrect. Move calculation to server or sync with server time.
- [ ] **Notes have no delete functionality visible** — API has `PATCH` for notes but no `DELETE` endpoint documented. Verify and implement delete.
- [ ] **Hiring module has no frontend page** — API endpoints exist for hiring but there's no UI page for it.

### Low Priority

- [ ] **No 404 page** — Unknown routes redirect to `/` silently. Create a proper 404 page.
- [ ] **Sticky notes positions not bounded** — Notes can be dragged outside the viewport with no way to recover them.
- [ ] **No confirmation dialog for destructive actions** — Delete user, reject leave, etc. execute immediately without confirmation.

---

## 10. Improvements Required

### Code Quality

#### 1. Split Large Page Components
`Tasks.tsx`, `Attendance.tsx`, and `Leave.tsx` are monolithic files (500-800 lines). Break them into:
```
pages/tasks/
  ├── Tasks.tsx              # Main container (state, data fetching)
  ├── KanbanView.tsx         # Kanban board
  ├── ListView.tsx           # Table/list view
  ├── CardsView.tsx          # Card grid view
  ├── TaskModal.tsx          # Create/edit modal
  └── TaskFilters.tsx        # Filter bar
```

#### 2. Centralize Auth Token Management
```typescript
// utils/auth.ts — one place for all auth operations
export const getToken = () => localStorage.getItem("token")
export const setToken = (t: string) => localStorage.setItem("token", t)
export const clearAuth = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("userId")
  localStorage.removeItem("userRoles")
}
```

#### 3. Add a Global Error Boundary
```tsx
// components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  // Catch render errors, show fallback UI, log to error service
}
```

#### 4. Form Validation Library
Currently validation is done manually. Add **React Hook Form + Zod** for:
- Type-safe validation schemas
- Better error messages
- Reduced boilerplate in form handlers

#### 5. Consistent API Response Typing
Define a generic wrapper type for all API responses:
```typescript
type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
  pagination?: Pagination
}
```

### Developer Experience

- [ ] Add **Prettier** configuration for consistent code formatting
- [ ] Add **Husky + lint-staged** for pre-commit checks
- [ ] Add **path aliases** in `tsconfig.json` (`@/components`, `@/utils`, etc.)
- [ ] Add `README.md` with setup instructions (currently missing)
- [ ] Document component props with JSDoc comments for complex components

---

## 11. New Features to Add

### Tier 1 — High Business Value (Add First)

#### 1. Notifications System
Real-time or polling-based notifications for:
- Leave request approved/rejected
- Task assigned to you
- Upcoming deadlines (24h warning)
- New message/comment on your task
- Birthday / work anniversary reminders

**Implementation:**
- Backend: WebSocket or SSE endpoint `/notifications`
- Frontend: Notification bell in header with badge count
- Toast for real-time alerts; drawer/panel for history

---

#### 2. Chat / Messaging Module
Internal messaging for team collaboration:
- Direct messages between employees
- Group channels per project/team
- Attach tasks or leave requests to messages
- Unread message count badge

**Routes:** `/messages`, `/messages/:userId`

---

#### 3. Reporting & Analytics Dashboard
Role-specific analytics:

**HR Dashboard:**
- Attendance rate by department/month (line chart)
- Leave utilization per employee (bar chart)
- Headcount over time
- Late arrivals heatmap

**Project Dashboard:**
- Task completion rate per project
- Overdue tasks by assignee
- Time-to-completion trends

**Admin Dashboard (extend current):**
- Revenue vs headcount
- Department budget utilization

---

#### 4. Performance Review / Appraisal Module
Quarterly/yearly performance reviews:
- Manager rates employee on defined KPIs
- Self-assessment form for employees
- 360-degree feedback (peer reviews)
- History of past reviews

**Routes:** `/appraisals`, `/appraisals/:id`

---

#### 5. Document Management
Store and manage employee documents:
- Employment contract, offer letter, NDA
- ID proofs, certificates
- Payslip archive (link to salary PDFs)
- Role-based visibility (employee sees own docs; HR sees all)

**Routes:** `/documents`

---

### Tier 2 — Medium Priority

#### 6. Hiring / Recruitment Module (Frontend)
The API already supports hiring (`/hiring`). Add the UI:
- Job listings (open positions)
- Applicant tracking pipeline (Applied → Interview → Offer → Hired)
- Candidate profile page
- Interview scheduling (link to calendar)

**Routes:** `/hiring`, `/hiring/:id`

---

#### 7. Announcements / Company Feed
Company-wide updates:
- Admin posts announcements (text, image, attachments)
- Employees see feed on dashboard
- Mark as read / acknowledge
- Pinned announcements at top

---

#### 8. Asset / Equipment Management
Track company assets assigned to employees:
- Laptop, phone, access card, etc.
- Assignment date, return date
- Condition on handover
- History of asset transfers

**Routes:** `/assets`

---

#### 9. Time Tracking Per Task / Project
Currently attendance tracks clock-in/out for the day. Add:
- Log hours against a specific task or project
- Weekly timesheets view
- Billable vs non-billable hours
- Export timesheet to CSV/PDF

---

#### 10. Shift Management
For companies with multiple shifts:
- Define shift schedules (Morning, Evening, Night)
- Assign employees to shifts
- Swap shift requests
- Auto-calculate expected vs actual attendance against shift

---

### Tier 3 — Nice to Have

#### 11. Onboarding Checklist
For new hires:
- Auto-generated checklist on user creation
- IT setup, HR docs, team introductions, tool access
- Manager monitors progress

#### 12. Expense Claims
- Employee submits expense with receipt photo
- Manager/Finance approves
- Reimbursement tracking and history

#### 13. Employee Directory / Org Chart
- Visual org chart showing reporting hierarchy
- Search by name, department, skill
- Quick contact card (email, phone, Slack handle)

#### 14. Exit Management
- Resignation submission
- Clearance checklist (IT, Finance, HR)
- Final settlement calculation

#### 15. Multi-language Support (i18n)
- Add `react-i18next` for internationalization
- Support English, Arabic, Hindi as starting languages
- Date/time locale formatting

---

## 12. UI/UX Enhancements

### Immediate Improvements

- [ ] **Dark mode** — Add a light/dark toggle. Tailwind CSS already supports `dark:` variants.
- [ ] **Mobile responsive layout** — Sidebar collapses on mobile; no hamburger menu currently exists.
- [ ] **Breadcrumbs** — Show current location within the app (e.g., Dashboard > Tasks > Create).
- [ ] **Keyboard shortcuts** — `N` for new task, `Esc` to close modal, `?` to show shortcuts help.
- [ ] **Empty states** — Add illustrated empty state screens when no data exists (no tasks, no notes, etc.).
- [ ] **Confirmation dialogs** — Before deleting a user or rejecting a leave, show a modal asking "Are you sure?".
- [ ] **Better table sorting** — Click column headers to sort data ascending/descending.
- [ ] **Global search** — A `Cmd+K` search bar that searches across tasks, employees, notes, and projects.

### Dashboard Improvements
- Add a **"My Tasks Due Today"** widget
- Add an **"Employee Birthdays This Week"** widget  
- Add a **"Recent Activity Feed"** (last 10 actions in the system)
- Make chart date range selectable (Today / This Week / This Month / Custom)

### Calendar Improvements
- Drag-and-drop to reschedule events
- Color-code events by type (leave = orange, task deadline = red, birthday = purple)
- Export calendar to `.ics` (Google Calendar, Outlook)
- Recurring event support (daily standup, weekly review)

### Task Management Improvements
- Subtasks (checklist items within a task)
- Task comments with @mentions
- File attachments per task
- Time estimate and time logged fields
- Task templates for common workflows

---

## 13. Performance Optimizations

### Code Splitting
Currently all routes load together. Add lazy loading:

```typescript
// In App.tsx
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"))
const Tasks = lazy(() => import("./pages/tasks/Tasks"))
// ... wrap in <Suspense fallback={<PageSkeleton />}>
```

### Image Optimization
- Use `<img loading="lazy">` for profile photos
- Compress avatar images server-side before storage
- Use WebP format where supported

### Query Optimization
- Use `staleTime` on queries that don't change often (e.g., user list: `staleTime: 5 * 60 * 1000`)
- Implement infinite scroll for tasks and salary records instead of paginated pages
- Cache salary PDFs in the browser to avoid re-fetching

### Bundle Size
```bash
# Analyze bundle
npm run build -- --report
```
- Tree-shake icon imports: import `{ Clock }` from `lucide-react` not the full package
- Remove unused Recharts components

---

## 14. Security Hardening

### Critical

- [ ] **Move JWT to HttpOnly cookie** — `localStorage` is vulnerable to XSS. Store tokens in `HttpOnly` cookies set by the backend.
- [ ] **Never trust client-side roles** — Currently roles are cached in `localStorage`. Always verify permissions server-side on every API call.
- [ ] **Add CSP headers** — Content Security Policy on the server to prevent XSS injection.
- [ ] **Sanitize user-generated content** — Sticky note content and task descriptions should be sanitized before rendering (use DOMPurify if rendering HTML).

### Medium Priority

- [ ] **Implement token refresh** — Auto-refresh the JWT before it expires using the refresh token endpoint.
- [ ] **Add rate limiting awareness** — Handle `429 Too Many Requests` responses gracefully with retry logic.
- [ ] **Audit Google OAuth redirect** — Ensure the redirect URL is validated server-side to prevent open redirect attacks.
- [ ] **Add session timeout warning** — Warn user 5 minutes before session expires so they can save work.

### Low Priority

- [ ] **Log sensitive actions** — Login, logout, role changes, salary views should be audit-logged.
- [ ] **Two-Factor Authentication (2FA)** — TOTP or SMS-based 2FA for admin and HR accounts.

---

## 15. Priority Roadmap

### Phase 1 — Foundation (Now)
Fix critical bugs and improve code quality before adding features.

| # | Task | Effort |
|---|------|--------|
| 1 | Standardize auth token key | 1 day |
| 2 | Implement auto token refresh | 2 days |
| 3 | Add `.env.example` and `README.md` | 0.5 day |
| 4 | Add error boundaries | 1 day |
| 5 | Add React Router lazy loading | 1 day |
| 6 | Add form validation with Zod | 3 days |
| 7 | Add confirmation dialogs for destructive actions | 1 day |
| 8 | Build Hiring module UI | 3 days |

**Phase 1 Total Estimate: ~12 days**

---

### Phase 2 — Core UX (Next Quarter)
Improve the experience for existing features.

| # | Task | Effort |
|---|------|--------|
| 1 | Mobile responsive layout + hamburger menu | 3 days |
| 2 | Dark mode toggle | 2 days |
| 3 | Global search (`Cmd+K`) | 3 days |
| 4 | Notifications system (polling-based) | 5 days |
| 5 | Announcements / company feed | 4 days |
| 6 | Task subtasks + comments + file attachments | 5 days |
| 7 | Reporting & analytics dashboard | 5 days |

**Phase 2 Total Estimate: ~27 days**

---

### Phase 3 — New Modules (Next 6 Months)
Add major new capabilities.

| # | Task | Effort |
|---|------|--------|
| 1 | Performance Appraisal module | 2 weeks |
| 2 | Document Management module | 1.5 weeks |
| 3 | Chat / Internal Messaging | 3 weeks |
| 4 | Time Tracking per task/project | 1.5 weeks |
| 5 | Employee Directory + Org Chart | 1 week |
| 6 | Shift Management | 2 weeks |
| 7 | Expense Claims | 1.5 weeks |

**Phase 3 Total Estimate: ~13 weeks**

---

### Phase 4 — Scale & Polish (Long Term)
Enterprise-grade features.

- Multi-language support (i18n)
- WebSocket real-time notifications
- Onboarding checklist automation
- Exit management workflow
- 2FA for admin accounts
- Full mobile app (React Native or PWA)
- API rate limiting and caching (Redis)
- End-to-end test suite (Playwright)

---

## Quick Reference — Key Files

| Purpose | File |
|---------|------|
| Route configuration | `src/App.tsx` |
| App entry + providers | `src/main.tsx` |
| API route constants | `src/apis/apiPath.ts` |
| HTTP client | `src/apis/apiService.ts` |
| Auth token utilities | `src/utils/moduleAccess.ts` |
| Role-based route guard | `src/components/auth/RoleRouteGuard.tsx` |
| Main layout wrapper | `src/components/layout/DashboardLayout.tsx` |
| Dashboard page | `src/pages/dashboard/Dashboard.tsx` |
| Tasks page | `src/pages/tasks/Tasks.tsx` |
| Attendance page | `src/pages/attendance/Attendance.tsx` |
| Leave page | `src/pages/leave/Leave.tsx` |
| Calendar page | `src/pages/calendar/CalendarPage.tsx` |
| Salary page | `src/pages/salary/Salary.tsx` |

---

*Last updated: April 2026 — Generated from codebase analysis*
