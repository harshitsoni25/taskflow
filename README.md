# 🚀 ProjectHub — Team Project Management Suite

> A full-stack, production-ready project management platform built with **React + Node.js/Express + SQLite (LibSQL)**.

Manage projects, assign tasks, track progress, collaborate via discussions, handle finances, manage documents, and more — all in one place.

---

## 🌐 Live Demo

| | Link |
|---|---|
| **🚀 Live App** | [**projecthub-frontend-pink.vercel.app**](https://projecthub-frontend-pink.vercel.app) |
| **⚙️ Backend API** | [**projecthub-l2c8.onrender.com/api/health**](https://projecthub-l2c8.onrender.com/api/health) |
| **📦 Source Code** | [github.com/harshitsoni25/taskflow](https://github.com/harshitsoni25/taskflow) |

**Demo credentials:**
```
Email:    demo@projecthub.app
Password: demo123
```

---

## ✨ Features

### Core
- 🔐 **JWT Authentication** — Signup / Login with secure token-based auth
- 📁 **Project Management** — Create projects, add/remove members with role-based access
- ✅ **Task Management** — Title, description, due date, priority (High/Medium/Low), assignee
- 📊 **Dashboard** — Live KPI cards, status breakdown, overdue alerts, tasks-per-member chart
- 🗂️ **Kanban Board** — Visual To Do / In Progress / Done columns per project

### Pages
| Page | Description |
|---|---|
| 📅 **Calendar** | Monthly view of all tasks by due date across all projects. Click any task to jump to its project. |
| 💬 **Discuss** | Slack-style threaded chat per project with persistent messages |
| 📄 **Documents** | Two-panel markdown doc manager — create, edit, view docs per project |
| 💰 **Expenses** | Budget tracker with KPI cards, per-project utilisation bars, expense ledger |
| 📈 **Finance** | Monthly budget vs actuals bar chart, variance tracking, ROI analysis |
| 🗣️ **Forums** | Community discussion board with tag filtering and reply threading |
| 📊 **Gantt & Reports** | Horizontal scrollable timeline — tasks as bars by due date, group by Project/Status/Priority |
| 🔖 **Milestones** | Track project milestones and completion progress |
| 🐛 **Issues** | Bug tracker with status, priority, and project filtering |
| ⏱️ **Timesheets** | Log and review time entries per project/task |
| 👥 **Users** | Team directory with role indicators |

### UI / UX
- 🔍 **Global Search** — Search tasks and projects from the navbar
- 🔔 **Notifications** — Live alerts for overdue and active tasks
- ➕ **Quick Create** — One-click creation from anywhere in the navbar
- 🌙 **Dark theme** — Enterprise-grade dark design system
- 📱 **Responsive** — Works on desktop, tablet, and mobile

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Axios, Recharts |
| **Backend** | Node.js 18, Express 5 |
| **Database** | LibSQL (SQLite-compatible, Railway-ready) |
| **Auth** | JWT (`jsonwebtoken` + `bcryptjs`) |
| **Deployment** | Railway (backend + frontend as separate services) |
| **Styling** | Vanilla CSS with custom design tokens (no Tailwind) |

---

## 📁 Project Structure

```
projecthub/
├── backend/
│   ├── server.js          # Express app entrypoint
│   ├── db.js              # Database connection & schema init
│   ├── seed.js            # Demo data seeder (idempotent)
│   ├── taskflow.db        # SQLite database file
│   ├── middleware/
│   │   └── auth.js        # JWT auth + role middleware
│   ├── routes/
│   │   ├── auth.js        # /api/auth/*
│   │   ├── projects.js    # /api/projects/*
│   │   ├── tasks.js       # /api/projects/:id/tasks/*
│   │   └── dashboard.js   # /api/dashboard
│   ├── railway.toml
│   └── package.json
│
└── frontend-app/
    ├── src/
    │   ├── App.jsx              # Root component + state-based routing
    │   ├── AuthContext.jsx      # Auth state management
    │   ├── api.js               # Axios client with JWT interceptors
    │   ├── index.css            # Full design system (CSS variables)
    │   ├── Sidebar.jsx
    │   ├── Dashboard.jsx
    │   ├── ProjectsPage.jsx
    │   ├── ProjectDetail.jsx    # Kanban + List view + Members
    │   ├── CalendarPage.jsx
    │   ├── DiscussPage.jsx
    │   ├── DocumentsPage.jsx
    │   ├── ExpensesPage.jsx
    │   ├── FinancePage.jsx
    │   ├── ForumsPage.jsx
    │   ├── GanttPage.jsx
    │   ├── IssuesPage.jsx
    │   ├── MilestonesPage.jsx
    │   ├── TimesheetsPage.jsx
    │   └── UsersPage.jsx
    ├── railway.toml
    └── package.json
```

---

## ⚙️ Local Development

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Clone the repo
```bash
git clone https://github.com/harshitsoni25/taskflow.git
cd taskflow
```

### 2. Start the Backend
```bash
cd backend
cp .env.example .env        # set JWT_SECRET in .env
npm install
node seed.js                # seed demo data
npm start                   # → http://localhost:3001
```

### 3. Start the Frontend
```bash
cd frontend-app
npm install
npm run dev                 # → http://localhost:5174
```

Login with `demo@projecthub.app` / `demo123`

---

## 🚀 Deploy to Railway

### Backend Service
1. New Project → Deploy from GitHub → `harshitsoni25/taskflow`
2. Set **Root Directory** = `backend`
3. Add environment variables:
   ```
   JWT_SECRET=your-strong-secret-here
   DATABASE_URL=file:./taskflow.db
   NODE_ENV=production
   FRONTEND_URLS=https://your-frontend.up.railway.app
   ```
4. Settings → Networking → Generate Domain

### Frontend Service
1. Same project → New Service → GitHub → `harshitsoni25/taskflow`
2. Set **Root Directory** = `frontend-app`
3. Add environment variable:
   ```
   VITE_API_URL=https://your-backend.up.railway.app/api
   ```
4. Settings → Networking → Generate Domain

---

## 🗄️ Database Schema

```sql
users          (id, name, email, password, created_at)
projects       (id, name, description, admin_id, created_at)
project_members(project_id, user_id, role, joined_at)
tasks          (id, project_id, title, description, due_date,
                priority, status, assignee_id, created_by,
                created_at, updated_at)

-- priority: 'low' | 'medium' | 'high'
-- status:   'todo' | 'in_progress' | 'done'
-- role:     'admin' | 'member'
```

---

## 🔒 Role-Based Access Control

| Action | Admin | Member |
|---|---|---|
| Create / delete project | ✅ | ❌ |
| Add / remove members | ✅ | ❌ |
| Create / delete tasks | ✅ | ❌ |
| Edit any task field | ✅ | ❌ |
| Update own task status | ✅ | ✅ |
| View project & tasks | ✅ | ✅ |

---

## 👤 Author

**Harshit Soni** — [github.com/harshitsoni25](https://github.com/harshitsoni25)

Built to demonstrate:
- Full-stack REST API design with Express
- JWT authentication & role-based authorization
- Relational data modeling with SQLite/LibSQL
- React state management without heavy frameworks
- Production deployment on Railway
- Enterprise-grade UI/UX with dark mode design system
