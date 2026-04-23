# CRM System — Project Guide & Improvement Roadmap

> A modern HR & Project Management CRM built with React 19, TypeScript, TanStack Query, Tailwind CSS, and Socket.io.

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
- Real-time internal chat (DMs via Socket.io)
- Company-wide announcements with pin and read-receipt
- Asset / equipment tracking and assignment
- Timesheets — log hours per project/task with CSV export
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
| JWT Decode | jwt-decode | 4.0.0 |
| Real-time | Socket.io Client | 4.8.3 |
| Forms | React Hook Form + Zod | 7.72.1 / 4.3.6 |
| Linting | ESLint + Prettier | 9.x / 3.x |
| Git Hooks | Husky + lint-staged | 9.x / 16.x |

---

## 3. Project Structure

```
src/
├── apis/
│   ├── api/
│   │   ├── announcements.ts   # Announcements CRUD, pin, read-receipt
│   │   ├── assets.ts          # Asset CRUD, assign, return
│   │   ├── attendance.ts      # Punch in/out, breaks, history
│   │   ├── auth.ts            # Login, signup, user CRUD, profile, birthdays
│   │   ├── chat.ts            # Chat messages, users list, online status
│   │   ├── leave.ts           # Apply, approve, reject leaves
│   │   ├── notes.ts           # Sticky notes CRUD
│   │   ├── projects.ts        # Project list and creation
│   │   ├── salary.ts          # Salary records and PDF
│   │   ├── tasks.ts           # Task CRUD with filters
│   │   └── timesheets.ts      # Time logging, weekly view, CSV export
│   ├── apiPath.ts             # Centralized API route constants
│   └── apiService.ts          # HTTP client with auth + error handling
│
├── components/
│   ├── UI/                    # Reusable primitives
│   │   ├── AnnouncementPopup.tsx  # Announcement notification popup
│   │   ├── BirthdayPopup.tsx      # Team birthday notification popup
│   │   ├── Button.tsx
│   │   ├── Dropdown.tsx
│   │   ├── Input.tsx
│   │   ├── Model.tsx
│   │   ├── PillTabBar.tsx         # Pill-style tab navigation
│   │   ├── Skeleton.tsx           # Loading skeleton
│   │   └── Table.tsx
│   ├── ErrorBoundary.tsx          # Global React error boundary
│   ├── auth/
│   │   └── RoleRouteGuard.tsx     # Role-based route enforcement
│   ├── calendar/              # 12 calendar sub-components
│   ├── header/                # Top navigation bar
│   ├── layout/
│   │   └── DashboardLayout.tsx
│   ├── leave/                 # Leave history + balance components
│   └── sidebar/               # Navigation sidebar
│
├── pages/
│   ├── announcements/         # Company feed with pin + read-receipt
│   ├── assets/                # Equipment tracking and assignment
│   ├── attendance/
│   ├── auth/                  # Login, SignUp
│   ├── calendar/
│   ├── chat/                  # Real-time direct messaging
│   ├── dashboard/             # Admin overview with charts
│   ├── leave/
│   ├── notes/
│   ├── profile/               # Personal profile editor
│   ├── salary/
│   ├── settings/
│   ├── tasks/
│   ├── timesheets/            # Weekly timesheet (built, route currently disabled)
│   └── userProfile/           # Public user view
│
├── types/                     # TypeScript interfaces for all entities
│   ├── announcement.types.ts
│   ├── api.types.ts
│   ├── asset.types.ts
│   ├── attendance.types.ts
│   ├── calendar.types.ts
│   ├── chat.types.ts
│   ├── leave.types.ts
│   ├── notes.types.ts
│   ├── project.types.ts
│   ├── task.types.ts
│   ├── timesheet.types.ts
│   └── user.types.ts
├── utils/
│   ├── auth.ts                # Centralized auth token management
│   ├── mediaUrl.ts            # Profile image URL resolver
│   ├── moduleAccess.ts        # Legacy role helpers
│   ├── socket.ts              # Socket.io connection helpers
│   ├── stickyNoteTheme.ts
│   └── taskStaleHide.ts
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
| `/chat` | Chat | All roles | Real-time direct messaging (Socket.io) |
| `/announcements` | Announcements | All roles | Company feed, pin & read-receipt |
| `/assets` | Assets | Admin, HR | Equipment tracking and assignment |
| `/salary` | Salary | Admin, HR | Salary records + PDF download |
| `/employee` | Employees | Admin, HR | Employee directory + management |
| `/settings` | Settings | Admin, HR | App configuration |
| `/profile` | My Profile | All roles | Edit personal information |
| `/user/:id` | User Profile | All roles | View any employee's profile |
| `/projects` | Projects | All roles | Project overview |
| `/timesheets` | Timesheets | All roles | Weekly time log + CSV export *(route disabled — built, pending enable)* |

### Role System

| Role | Access Level |
|------|-------------|
| `super-admin` | Full access to everything |
| `admin` | All features except super-admin only areas |
| `hr` | Salary, leave approval, employee management, assets |
| `manager` | Team tasks, leave approval for team |
| `employee` | Own tasks, attendance, leave, notes, chat |

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
GET    /auth/team/birthdays     # Upcoming team birthdays
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

### Chat
```
GET    /chat/users              # List all users available to chat
GET    /chat/online             # List currently online users
GET    /chat/{receiverId}       # Get message history with a user (paginated)
```
> Real-time delivery uses **Socket.io** (connects to the server root, not `/api/v1`).

### Announcements
```
GET    /announcements           # List all announcements
POST   /announcements/create    # Create announcement (admin/HR)
PUT    /announcements/{id}      # Edit announcement
PATCH  /announcements/{id}/read # Mark announcement as read
PATCH  /announcements/{id}/pin  # Pin or unpin announcement
DELETE /announcements/{id}      # Delete announcement (admin/HR)
```

### Assets
```
GET    /assets                  # List assets (filterable by status, assignedTo)
POST   /assets/create           # Create asset record (admin/HR)
GET    /assets/{id}             # Get asset details
PUT    /assets/{id}             # Update asset
PATCH  /assets/{id}/assign      # Assign asset to employee
PATCH  /assets/{id}/return      # Mark asset as returned
DELETE /assets/{id}             # Delete asset record
```

### Timesheets
```
GET    /timesheets              # List entries (filterable by week, year, userId, project, billable)
POST   /timesheets/log          # Log hours against a project/task
PUT    /timesheets/{id}         # Update a timesheet entry
DELETE /timesheets/{id}         # Delete a timesheet entry
GET    /timesheets/export/csv   # Download timesheet as CSV
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

- JWT stored in `localStorage` under key `token` (single canonical key — standardized)
- All API requests send: `Authorization: Bearer <token>`
- On `403 ACCOUNT_INACTIVE` → clear session → redirect `/login?reason=account_inactive`
- Token refresh endpoint available at `/auth/refresh-token`
- `utils/auth.ts` is the single source of truth for all auth storage operations. It also clears legacy keys (`accessToken`, `authToken`) on logout.

### Route Guard Flow

```
Navigate to /salary
  → DashboardLayout checks: token exists? No → /login
  → RoleRouteGuard checks: userRole in allowedRoles? No → /
  → Page renders
```

---

## 7. State Management Architecture

### Pattern: React Query + Local State + Socket.io

```
User Action
  └─► useState (form, modal, pagination)
      └─► useMutation (API call)
          └─► Query Cache invalidation
              └─► useQuery refetches automatically
                  └─► Component re-renders
                      └─► Toast notification

Real-time Chat (Socket.io):
  connectSocket() on login → socket emits/listens for message events
  → Incoming message → queryClient.invalidateQueries(["chatMessages"])
  → UI updates without polling
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

// Online users — polled every 30 seconds
const { data } = useQuery({
  queryKey: ["onlineUsers"],
  queryFn: fetchOnlineUsers,
  refetchInterval: 30_000
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
npm run dev            # Start dev server (port 5173)
npm run build          # Production build
npm run preview        # Preview production bundle
npm run lint           # Run ESLint
npm run format         # Format all src files with Prettier
npm run format:check   # Check formatting without writing
```

> **Husky** runs ESLint + Prettier automatically on every `git commit` via lint-staged.

---

## 9. Current Issues & Bugs to Fix

### High Priority

- [x] **Token key inconsistency** — Standardized. `utils/auth.ts` uses `"token"` as the single key and clears legacy keys (`accessToken`, `authToken`) on logout.
- [ ] **No token refresh mechanism** — JWT expiry is not handled automatically. Users get silently logged out or see API errors. Implement auto-refresh using the `/auth/refresh-token` endpoint.
- [ ] **Roles stored in localStorage** — User roles cached in `localStorage` can be tampered with client-side. Always re-validate roles from the server on sensitive operations.
- [ ] **Missing `.env.example` file** — New developers don't know what environment variables are required.
- [ ] **Large page files** — `Tasks.tsx` is 600+ lines. Split into sub-components for maintainability.

### Medium Priority

- [x] **No error boundaries** — `components/ErrorBoundary.tsx` is now added and wraps major sections.
- [ ] **No loading state on route transitions** — Navigation feels abrupt. Add a top-progress-bar (e.g., NProgress).
- [ ] **Attendance elapsed time calculated client-side** — If user's device clock is wrong, worked hours will be incorrect. Move calculation to server or sync with server time.
- [x] **Notes have no delete functionality** — Confirmed and implemented.
- [ ] **Hiring module has no frontend page** — API endpoints exist for hiring but there's no UI page for it.
- [ ] **Timesheets route disabled** — `Timesheets.tsx` is built and fully functional but the route `/timesheets` is commented out in `App.tsx`. Re-enable once backend is confirmed ready.

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

#### 2. Centralize Auth Token Management ✅ Done
`utils/auth.ts` is the single source of truth:
```typescript
export const getToken = () => localStorage.getItem("token")
export const setToken = (t: string) => localStorage.setItem("token", t)
export const clearAuth = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("userId")
  localStorage.removeItem("userRoles")
  localStorage.removeItem("accessToken")   // legacy cleanup
  localStorage.removeItem("authToken")     // legacy cleanup
}
```

#### 3. Global Error Boundary ✅ Done
`components/ErrorBoundary.tsx` catches render errors and shows a fallback UI.

#### 4. Form Validation Library ✅ Done
**React Hook Form + Zod** are installed and available for all new forms.

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

- [x] Add **Prettier** configuration for consistent code formatting
- [x] Add **Husky + lint-staged** for pre-commit checks
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

#### 2. Chat / Messaging Module ✅ Shipped
Internal real-time direct messaging is live at `/chat`:
- User list with online presence indicators
- Real-time delivery via Socket.io
- Message history with date separators
- Read receipts (single ✓ / double ✓✓)
- Avatar with initials fallback

**Remaining enhancements:**
- Group channels per project/team
- Attach tasks or leave requests to messages
- Unread message count badge in sidebar

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

#### 7. Announcements / Company Feed ✅ Shipped
Live at `/announcements`:
- Admin/HR can create, edit, pin, and delete announcements
- All employees can view and mark as read
- Pinned announcements shown at top
- `BirthdayPopup` and `AnnouncementPopup` components surface alerts in the header

---

#### 8. Asset / Equipment Management ✅ Shipped
Live at `/assets`:
- Create and track company assets (laptop, phone, access card, etc.)
- Assign to employees with condition and handover note
- Return flow with condition tracking
- Status badges: Available / Assigned / Under Repair / Retired
- Assignment history per asset

---

#### 9. Time Tracking Per Task / Project ✅ Built (pending route enable)
`Timesheets.tsx` is complete. Route `/timesheets` is disabled pending backend confirmation:
- Log hours against a specific project/task
- Weekly timesheets view with ISO week navigation
- Billable vs non-billable hours toggle
- Export timesheet to CSV

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
- Add an **"Employee Birthdays This Week"** widget — birthday data available via `/auth/team/birthdays`
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

### Chat Improvements
- Unread message badge count in sidebar
- Group / channel messaging
- Message search
- File/image sharing

---

## 13. Performance Optimizations

### Code Splitting
Currently all routes load together. Add lazy loading:

```typescript
// In App.tsx
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"))
const Tasks = lazy(() => import("./pages/tasks/Tasks"))
const Chat = lazy(() => import("./pages/chat/Chat"))
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
- [ ] **Sanitize user-generated content** — Sticky note content, task descriptions, and chat messages should be sanitized before rendering (use DOMPurify if rendering HTML).

### Medium Priority

- [ ] **Implement token refresh** — Auto-refresh the JWT before it expires using the refresh token endpoint.
- [ ] **Add rate limiting awareness** — Handle `429 Too Many Requests` responses gracefully with retry logic.
- [ ] **Audit Google OAuth redirect** — Ensure the redirect URL is validated server-side to prevent open redirect attacks.
- [ ] **Add session timeout warning** — Warn user 5 minutes before session expires so they can save work.
- [ ] **Socket.io authentication** — Verify token on the server before accepting the socket connection. Token is sent via `socket.auth = { token }` on connect.

### Low Priority

- [ ] **Log sensitive actions** — Login, logout, role changes, salary views should be audit-logged.
- [ ] **Two-Factor Authentication (2FA)** — TOTP or SMS-based 2FA for admin and HR accounts.

---

## 15. Priority Roadmap

### Phase 1 — Foundation ✅ Mostly Done
Critical bugs fixed and DX tooling in place.

| # | Task | Status |
|---|------|--------|
| 1 | Standardize auth token key | ✅ Done — `utils/auth.ts` |
| 2 | Add error boundaries | ✅ Done — `components/ErrorBoundary.tsx` |
| 3 | Add form validation with Zod | ✅ Done — React Hook Form + Zod installed |
| 4 | Add Prettier + Husky pre-commit | ✅ Done |
| 5 | Implement auto token refresh | ⬜ Pending |
| 6 | Add `.env.example` | ⬜ Pending |
| 7 | Add confirmation dialogs for destructive actions | ⬜ Pending |
| 8 | Build Hiring module UI | ⬜ Pending |

---

### Phase 2 — Core UX (Next Quarter)
Improve the experience for existing features.

| # | Task | Status |
|---|------|--------|
| 1 | Chat / Internal Messaging | ✅ Done — `/chat` with Socket.io |
| 2 | Announcements / Company Feed | ✅ Done — `/announcements` |
| 3 | Asset Management | ✅ Done — `/assets` |
| 4 | Time Tracking (Timesheets) | ✅ Built — route pending enable |
| 5 | Mobile responsive layout + hamburger menu | ⬜ Pending |
| 6 | Dark mode toggle | ⬜ Pending |
| 7 | Global search (`Cmd+K`) | ⬜ Pending |
| 8 | Notifications system (polling-based) | ⬜ Pending |
| 9 | Task subtasks + comments + file attachments | ⬜ Pending |
| 10 | Reporting & analytics dashboard | ⬜ Pending |

---

### Phase 3 — New Modules (Next 6 Months)
Add major new capabilities.

| # | Task | Effort |
|---|------|--------|
| 1 | Performance Appraisal module | 2 weeks |
| 2 | Document Management module | 1.5 weeks |
| 3 | Hiring/Recruitment UI | 1 week |
| 4 | Employee Directory + Org Chart | 1 week |
| 5 | Shift Management | 2 weeks |
| 6 | Expense Claims | 1.5 weeks |

**Phase 3 Total Estimate: ~10 weeks**

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
| Auth token utilities | `src/utils/auth.ts` |
| Socket.io connection | `src/utils/socket.ts` |
| Role-based route guard | `src/components/auth/RoleRouteGuard.tsx` |
| Global error boundary | `src/components/ErrorBoundary.tsx` |
| Main layout wrapper | `src/components/layout/DashboardLayout.tsx` |
| Dashboard page | `src/pages/dashboard/Dashboard.tsx` |
| Tasks page | `src/pages/tasks/Tasks.tsx` |
| Chat page | `src/pages/chat/Chat.tsx` |
| Announcements page | `src/pages/announcements/Announcements.tsx` |
| Assets page | `src/pages/assets/Assets.tsx` |
| Timesheets page | `src/pages/timesheets/Timesheets.tsx` |
| Attendance page | `src/pages/attendance/Attendance.tsx` |
| Leave page | `src/pages/leave/Leave.tsx` |
| Calendar page | `src/pages/calendar/CalendarPage.tsx` |
| Salary page | `src/pages/salary/Salary.tsx` |

---

*Last updated: April 2026 — Reflects Chat, Announcements, Assets, and Timesheets modules*
