# 🚀 ProjectHub — Team Task Manager

A full-stack, production-ready team project & task management platform. Built with React + Vite on the frontend and Node.js + Express + LibSQL (SQLite-compatible) on the backend. Deployed on **Vercel** (frontend) and **Railway** (backend).

---

## 🌐 Live Demo

| Service | URL |
|---|---|
| **Frontend** | [https://projecthub-frontend-pink.vercel.app](https://projecthub-frontend-pink.vercel.app) |
| **Backend API** | Deployed on Railway |

**Demo credentials**
```
Email:    demo@projecthub.app
Password: demo123
```

---

## ✨ Features

### 🏠 Dashboard
- Real-time workspace overview with KPI stat cards (Total Tasks, In Progress, Completed, Overdue, Projects)
- Task status breakdown bar chart (To Do / In Progress / Done)
- Priority distribution chart (High / Medium / Low)
- Overdue task alerts with project and assignee info
- Tasks-per-team-member workload view with progress bars
- Project overview table with completion progress

### 📁 Projects
- Create, view, and manage multiple projects
- Role-based access — Admin vs Member
- Per-project member management (invite users)
- Kanban board with 3 columns: To Do → In Progress → Done
- Gantt-style timeline view
- Task creation, editing, and deletion with modals
- Task priority (High / Medium / Low) and due date tracking
- Assignee selection from project members

### ✅ Tasks
- Personal "My Tasks" view across all projects
- Filter by status, priority, assignee
- Create tasks directly from the task page
- Visual priority badges and overdue indicators

### 📅 Calendar
- Monthly calendar view of all tasks
- Tasks plotted by due date
- Click tasks to navigate to the project

### 📈 Reports
- Visual analytics: status distribution, priority split
- Task completion rate per project
- Tabular task report with filters

### 📋 Issues
- Issue tracker per workspace
- Status, priority, and assignee fields

### 🏁 Milestones
- Project milestone tracking
- Progress indicators

### ⏱️ Timesheets
- Log time per task
- View weekly timesheet summary

### 💸 Expenses
- Track project-related expenses
- Categorized expense listing

### 📄 Documents
- Upload and manage project documents
- Rich document listing UI

### 💰 Finance
- Financial overview per project
- Budget vs. expense tracking

### 💬 Discuss
- Team discussion threads per workspace

### 🗣️ Forums
- Community-style forum with topic threads

### 📰 Feed
- Activity feed across projects and tasks

### 👥 Users
- Team member directory
- Role display (Admin / Member)

### 🔍 Global Search
- Instant search across projects and tasks
- Quick-jump shortcuts to main views

### 🔔 Notifications
- Live notification panel from dashboard data
- Overdue task alerts, active task updates

### 📱 Mobile Responsive
- Slide-in sidebar drawer on mobile (≤768px)
- Hamburger ☰ menu toggle
- Touch-friendly layout across all pages

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **Vite** | Build tool & dev server |
| **Vanilla CSS** | Styling — custom design system, no UI library |
| **Google Fonts** (Syne + DM Sans) | Typography |
| **Axios** | HTTP client via `api.js` |
| **Vercel** | Hosting & auto-deployment |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** | Runtime |
| **Express 5** | REST API framework |
| **LibSQL / Turso** | SQLite-compatible database (local file or remote) |
| **bcryptjs** | Password hashing |
| **jsonwebtoken** | JWT authentication |
| **uuid** | UUID generation for IDs |
| **dotenv** | Environment variable management |
| **cors** | Cross-origin resource sharing |
| **Railway** | Backend hosting & auto-deployment |

---

## 📂 Project Structure

```
taskflow/
├── frontend-app/               # React + Vite frontend
│   ├── public/
│   ├── src/
│   │   ├── App.jsx             # Root layout, routing, navbar, search
│   │   ├── AuthContext.jsx     # JWT auth context + hooks
│   │   ├── Sidebar.jsx         # Collapsible sidebar navigation
│   │   ├── Dashboard.jsx       # Home dashboard with stats & charts
│   │   ├── LoginPage.jsx       # Login form
│   │   ├── SignupPage.jsx      # Registration form
│   │   ├── ProjectsPage.jsx    # Projects grid + create project
│   │   ├── ProjectDetail.jsx   # Kanban board, members, task management
│   │   ├── MyTasksPage.jsx     # Personal task list across all projects
│   │   ├── CalendarPage.jsx    # Monthly task calendar
│   │   ├── ReportsPage.jsx     # Analytics and charts
│   │   ├── IssuesPage.jsx      # Issue tracker
│   │   ├── MilestonesPage.jsx  # Project milestones
│   │   ├── TimesheetsPage.jsx  # Time tracking
│   │   ├── ExpensesPage.jsx    # Expense management
│   │   ├── DocumentsPage.jsx   # Document storage
│   │   ├── FinancePage.jsx     # Financial overview
│   │   ├── DiscussPage.jsx     # Team discussions
│   │   ├── ForumsPage.jsx      # Forum threads
│   │   ├── FeedPage.jsx        # Activity feed
│   │   ├── GanttPage.jsx       # Gantt chart view
│   │   ├── UsersPage.jsx       # Team members directory
│   │   ├── TaskModal.jsx       # Task create/edit modal
│   │   ├── PlaceholderPage.jsx # Generic placeholder page
│   │   ├── api.js              # Axios instance with JWT header
│   │   └── index.css           # Full design system (tokens, components, responsive)
│   ├── index.html
│   ├── vite.config.js
│   └── vercel.json             # Vercel deployment config (SPA rewrite rules)
│
├── backend/                    # Node.js + Express API
│   ├── routes/
│   │   ├── auth.js             # POST /register, POST /login
│   │   ├── projects.js         # CRUD projects + members
│   │   ├── tasks.js            # CRUD tasks per project
│   │   └── dashboard.js        # Aggregated dashboard stats
│   ├── middleware/
│   │   └── auth.js             # JWT verification middleware
│   ├── db.js                   # LibSQL client, schema init, demo user seed
│   ├── seed.js                 # Full demo data seeder
│   ├── server.js               # Express app, CORS, route mounting
│   ├── railway.toml            # Railway deployment config
│   ├── .env.example            # Environment variable template
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🗄️ Database Schema

Using **LibSQL** (SQLite-compatible). Tables are auto-created on server start via `initDB()`.

### `users`
```sql
CREATE TABLE users (
  id         TEXT PRIMARY KEY,          -- UUID
  name       TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,             -- bcrypt hashed
  created_at TEXT DEFAULT (datetime('now'))
);
```

### `projects`
```sql
CREATE TABLE projects (
  id          TEXT PRIMARY KEY,         -- UUID
  name        TEXT NOT NULL,
  description TEXT,
  admin_id    TEXT NOT NULL,            -- FK → users.id
  created_at  TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (admin_id) REFERENCES users(id)
);
```

### `project_members`
```sql
CREATE TABLE project_members (
  project_id TEXT NOT NULL,             -- FK → projects.id
  user_id    TEXT NOT NULL,             -- FK → users.id
  role       TEXT DEFAULT 'member',     -- 'admin' | 'member'
  joined_at  TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (project_id, user_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)
);
```

### `tasks`
```sql
CREATE TABLE tasks (
  id          TEXT PRIMARY KEY,         -- UUID
  project_id  TEXT NOT NULL,            -- FK → projects.id
  title       TEXT NOT NULL,
  description TEXT,
  due_date    TEXT,                     -- ISO date string
  priority    TEXT DEFAULT 'medium',    -- 'high' | 'medium' | 'low'
  status      TEXT DEFAULT 'todo',      -- 'todo' | 'in_progress' | 'done'
  assignee_id TEXT,                     -- FK → users.id (nullable)
  created_by  TEXT NOT NULL,            -- FK → users.id
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id)  REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (assignee_id) REFERENCES users(id),
  FOREIGN KEY (created_by)  REFERENCES users(id)
);
```

---

## 🚀 Deploy to Railway (Backend)

### Step 1 — Create a Railway Project
1. Go to [railway.app](https://railway.app) → **New Project**
2. Select **Deploy from GitHub repo** → choose `taskflow`
3. Set the **root directory** to `backend`

### Step 2 — Set Environment Variables
In Railway → your service → **Variables**, add:

| Variable | Value |
|---|---|
| `PORT` | `3001` |
| `JWT_SECRET` | A long random secret string |
| `DATABASE_URL` | `file:./taskflow.db` (local) or your Turso URL |
| `FRONTEND_URLS` | `https://projecthub-frontend-pink.vercel.app` |

### Step 3 — Deploy Settings
Railway will auto-detect `railway.toml`:
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "node seed.js && node server.js"
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

### Step 4 — Get Your API URL
After deploy, copy your Railway service URL (e.g. `https://taskflow-backend.up.railway.app`).

### Step 5 — Update Frontend
In `frontend-app/src/api.js`, set the `baseURL` to your Railway URL:
```js
const api = axios.create({
  baseURL: 'https://your-service.up.railway.app/api',
});
```

---

## 💻 Local Development

### Prerequisites
- Node.js 18+
- npm

### Backend
```bash
cd backend
cp .env.example .env        # fill in JWT_SECRET
npm install
npm run dev                 # starts on http://localhost:3001
```

### Frontend
```bash
cd frontend-app
npm install
npm run dev                 # starts on http://localhost:5173
```

---

## 🔑 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/projects` | ✅ | List user's projects |
| POST | `/api/projects` | ✅ | Create project |
| GET | `/api/projects/:id` | ✅ | Get project details |
| PUT | `/api/projects/:id` | ✅ | Update project |
| DELETE | `/api/projects/:id` | ✅ | Delete project |
| POST | `/api/projects/:id/members` | ✅ | Add member |
| DELETE | `/api/projects/:id/members/:uid` | ✅ | Remove member |
| GET | `/api/projects/:id/tasks` | ✅ | List project tasks |
| POST | `/api/projects/:id/tasks` | ✅ | Create task |
| PUT | `/api/projects/:id/tasks/:tid` | ✅ | Update task |
| DELETE | `/api/projects/:id/tasks/:tid` | ✅ | Delete task |
| GET | `/api/dashboard` | ✅ | Aggregated dashboard data |
| GET | `/api/health` | No | Health check |

---

## 📄 License

MIT — free to use and modify.
