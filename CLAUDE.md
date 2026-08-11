# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev         # Start Vite dev server (HMR) — frontend on :5173, proxies /api → :8080
npm run build       # Production build
npm run preview     # Preview production build locally

# Go backend
cd server
go run main.go      # Start Go server on :8080
go build -o todo-server.exe .
```

## Architecture

Full-stack todo kanban app — React 19 + Vite 8 frontend, Go 1.24 + chi backend, MySQL.

**Frontend:** `useTodos` hook calls REST API instead of localStorage. `AuthContext` manages JWT token + username in localStorage. `AuthGate` switches between LoginForm / RegisterForm / KanbanApp based on auth state — no router library needed.

**Backend** (`server/`): chi router, sqlx for MySQL, JWT auth middleware, excelize for Excel generation.
- Auth: `handlers/auth.go` — bcrypt password hashing, JWT token generation (7-day expiry)
- Tasks: `handlers/tasks.go` — user-scoped CRUD with ownership check
- Report: `handlers/report.go` — Excel weekly report, supports template-based generation
- Template: `handlers/template.go` — global Excel template upload/download, stored as `uploads/template.xlsx`

**Database:** MySQL at `192.168.1.200:3306`, database `todo_db`. Two tables: `users` (id, username, bcrypt password, created_at) and `tasks` (id, user_id FK, title, description, status ENUM, priority ENUM, timestamps). Auto-migrated on server start.

**API:** All routes prefixed `/api`. Auth routes are public; all others require `Authorization: Bearer <token>`. Frontend Vite proxies `/api` → `http://localhost:8080` in dev.

**Drag-and-drop:** `@dnd-kit/core` with `closestCorners` collision detection. Columns are `useDroppable` targets (id: `col-pending`, `col-in_progress`, `col-completed`). Tasks are `useSortable` within per-column `SortableContext`. Cross-column drop → status auto-updates via API.

**Styling:** CSS custom properties on `:root` (warm light palette). `global.css` (tokens), `App.css` (all component styles + auth pages). Responsive at 1024px and 480px.

## Key Files

| File | Role |
|------|------|
| `src/App.jsx` | Root: AuthGate, KanbanApp, DndContext, all callbacks |
| `src/context/AuthContext.jsx` | JWT token management, login/register/logout |
| `src/hooks/useTodos.js` | Task state via REST API (replaced localStorage) |
| `src/api/client.js` | fetch wrapper with auth header and 401 handling |
| `server/main.go` | Entry point, route setup, middleware chain |
| `server/config/config.go` | Env var loading (.env), DSN construction |
| `server/db/mysql.go` | MySQL connection + auto-migration |
| `server/services/report.go` | Excel report generation (default + template-based) |
