# TMS Frontend

A modern **Team Management System** built with React and TypeScript. It provides a full-featured workspace for teams to manage attendance, tasks, leave, salary, announcements, chat, and more — all in one place.

**Live URL:** [frontend-zeta-eight-57.vercel.app](https://frontend-zeta-eight-57.vercel.app)

---

## Features

| Module | Description |
|---|---|
| **Dashboard** | Overview of attendance, tasks, projects, and team activity |
| **Tasks** | Kanban and list views, task assignment, priorities, due dates |
| **Attendance** | Daily check-in/out, weekly summary, attendance history |
| **Leave** | Apply for leave, inbox approval flow, leave history |
| **Calendar** | Team events, personal calendar, event creation |
| **Chat** | Real-time 1:1 messaging via WebSocket |
| **Salary** | Salary slips with PDF download |
| **Announcements** | Company-wide announcements with read tracking |
| **Assets** | Company asset management |
| **Notes** | Sticky notes with drag-and-drop canvas |
| **Organization** | Org structure, member management, join requests |
| **Timesheets** | Weekly timesheet tracking |
| **Profile / Settings** | User profile, role management, project settings |

---

## Tech Stack

| Category | Technology |
|---|---|
| **Framework** | React 19 + TypeScript |
| **Build Tool** | Vite |
| **Styling** | Tailwind CSS |
| **Routing** | React Router DOM |
| **Server State** | TanStack React Query |
| **Forms** | React Hook Form + Zod |
| **Charts** | Recharts |
| **Real-time** | Socket.IO Client |
| **Auth** | JWT + Google OAuth (`@react-oauth/google`) |
| **Icons** | Lucide React + React Icons |
| **Notifications** | React Hot Toast |
| **Linting** | ESLint (react-hooks v7 + TypeScript) |
| **Formatting** | Prettier |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
git clone <repo-url>
cd frontend
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:5051/api/v1
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Development

```bash
npm run dev
```

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm run format` | Format all source files with Prettier |
| `npm run format:check` | Check formatting without writing |
| `npm run preview` | Preview the production build locally |

---

## Project Structure

```
src/
├── apis/
│   ├── api/          # Per-feature API hooks (React Query)
│   ├── apiPath.ts    # Centralized API endpoint paths
│   └── apiService.ts # Base fetch wrapper with auth
├── components/
│   ├── UI/           # Reusable UI primitives (Button, Input, Table, Modal…)
│   ├── auth/         # Route guards
│   ├── header/       # Top navigation bar
│   ├── sidebar/      # Side navigation
│   └── …             # Feature-specific components
├── pages/            # One directory per feature/route
├── hooks/            # Custom React hooks
├── types/            # TypeScript interfaces
├── utils/            # Pure helpers (auth, socket, media URL…)
└── constants/        # App-wide constants
```

---

## CI/CD Pipeline

This project uses **GitHub Actions** for continuous integration and **Vercel** for production hosting.

### Platform

| | |
|---|---|
| **Hosting** | [Vercel](https://vercel.com) |
| **CI/CD** | GitHub Actions |
| **Production URL** | [frontend-zeta-eight-57.vercel.app](https://frontend-zeta-eight-57.vercel.app) |

---

### CI Workflow — `ci.yml`

**Trigger:** Every push to any branch except `main`, and every pull request targeting `main`.

**Purpose:** Acts as a quality gate before code reaches production. All checks must pass before a PR can be merged.

```
Push / Pull Request (non-main)
         │
         ▼
┌─────────────────────────────┐
│  1. Checkout code           │
│  2. Setup Node.js 20        │
│  3. npm ci                  │  ← clean install from lockfile
│  4. Prettier format check   │  ← fails if any file is not formatted
│  5. ESLint lint             │  ← fails on any lint error
│  6. tsc + vite build        │  ← fails on TypeScript errors
└─────────────────────────────┘
```

**Steps in detail:**

| Step | Command | What it checks |
|---|---|---|
| Install | `npm ci` | Reproducible install from `package-lock.json` |
| Format | `npm run format:check` | All `.ts`, `.tsx`, `.css` files match Prettier config |
| Lint | `npm run lint` | ESLint rules (React Hooks, TypeScript, no unused vars) |
| Build | `npm run build` | TypeScript type errors + Vite production build |

---

### Deploy Workflow — `deploy.yml`

**Trigger:** Every push to the `main` branch.

**Purpose:** Runs the full quality gate, then builds and deploys to Vercel production.

```
Push to main
      │
      ▼
┌─────────────────────────────┐
│  1. Checkout code           │
│  2. Setup Node.js 20        │
│  3. npm ci                  │
│  4. Prettier format check   │
│  5. ESLint lint             │
│  6. tsc + vite build        │  ← type-check gate
│  7. Install Vercel CLI      │
│  8. vercel pull             │  ← sync env vars from Vercel
│  9. vercel build --prod     │  ← generate .vercel/output/
│ 10. vercel deploy --prebuilt│  ← push to Vercel CDN
└─────────────────────────────┘
```

**Steps in detail:**

| Step | Command | Purpose |
|---|---|---|
| Install | `npm ci` | Clean dependency install |
| Format | `npm run format:check` | Enforce code style |
| Lint | `npm run lint` | Enforce code quality |
| Type-check | `npm run build` | Catch TypeScript errors early |
| Vercel CLI | `npm install -g vercel@latest` | Install deployment tool |
| Pull env | `vercel pull --yes --environment=production` | Download production env vars from Vercel dashboard |
| Vercel build | `vercel build --prod` | Build using Vercel's pipeline → outputs to `.vercel/output/` |
| Deploy | `vercel deploy --prebuilt --prod` | Upload pre-built output to Vercel's global CDN |

---

### Required GitHub Secrets

The deploy workflow requires the following secrets set in **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Description |
|---|---|
| `VERCEL_TOKEN` | Personal access token from [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Found in `.vercel/project.json` after running `vercel link` |
| `VERCEL_PROJECT_ID` | Found in `.vercel/project.json` after running `vercel link` |
| `VITE_API_BASE_URL` | Backend API base URL for production |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID |

---

### Branch Strategy

```
feature/* ──┐
fix/*    ──►├── Pull Request ──► main ──► Auto-deploy to Vercel
hotfix/* ──┘        │
                    │
              CI checks must
              pass to merge
```

- All work is done on feature/fix branches
- PRs to `main` must pass CI (format + lint + build)
- Merging to `main` automatically triggers production deploy

---

## License

MIT
