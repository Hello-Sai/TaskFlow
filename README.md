# TaskFlow

A lightweight task board — create boards, organize tasks into To Do / In Progress / Done columns, set priorities, search, and filter.

Built with **Django REST Framework** (backend) and **React + Vite** (frontend).

---

## Quick Start (Local)

### Option A — Plain commands

**Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data        # loads sample board + tasks
python manage.py test             # run all tests
python manage.py runserver
```
Backend runs at `http://localhost:8000`

**Frontend** (new terminal)
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`  
API calls are proxied to the backend automatically (Vite proxy config).

---

### Option B — Docker (one command)

```bash
docker compose up --build
```
App available at `http://localhost` (port 80).

> **First run:** Docker auto-migrates and seeds sample data.

---

## Database

- Engine: **SQLite** (`backend/db.sqlite3`)
- Schema: [`backend/schema.sql`](backend/schema.sql) — full `CREATE TABLE` statements with primary keys, foreign keys, `NOT NULL`, and `CHECK` constraints
- Migrations: `backend/task_management/migrations/`

### The two non-trivial queries (from schema.sql)

**1 — Task count per column on a board**
```sql
SELECT c.title, COUNT(t.id) AS task_count
FROM columns c
LEFT JOIN tasks t ON t.column_id = c.id
WHERE c.board_id = ?
GROUP BY c.id, c.title;
```
Used for the count badge in each column header (`BoardTaskCountAPIView`).

**2 — Tasks by priority, newest first**
```sql
SELECT t.*, c.title AS column_name, b.title AS board_name
FROM tasks t
JOIN columns c ON t.column_id = c.id
JOIN boards  b ON c.board_id  = b.id
WHERE t.priority = ?
ORDER BY t.created_at DESC;
```
Used by `GET /api/tasks/?priority=high` (and the `?search=` param).

---

## Running Tests

```bash
cd backend
source venv/bin/activate
python manage.py test
```

Three test groups:
1. **Validation** — creating a task with an empty/missing title returns `400`
2. **Move task** — `PATCH /api/tasks/<id>/` with a new column ID updates the DB record
3. **DB queries** — priority filter and count-per-column return the right rows for known seed data

---

## API Endpoints

| Method | URL | What it does |
|--------|-----|--------------|
| GET | `/api/boards/` | List all boards |
| POST | `/api/boards/` | Create a board (auto-creates 3 columns) |
| GET | `/api/boards/<id>/` | Get one board |
| GET | `/api/tasks/` | List tasks (supports `?search=`, `?priority=`, `?board_id=`) |
| POST | `/api/tasks/` | Create a task |
| GET | `/api/tasks/<id>/` | Get one task |
| PATCH | `/api/tasks/<id>/` | Update a task (move column by changing `column` field) |
| DELETE | `/api/tasks/<id>/` | Delete a task |
| GET | `/api/boards/<id>/task-counts/` | Task count per column |

---

## Deploying to Render

### Step 1 — Push to GitHub

```bash
cd /home/dell/Documents/projects/TaskFlow
git init
git add .
git commit -m "Initial commit"
gh repo create taskflow --public --source=. --push
```
(requires [GitHub CLI](https://cli.github.com/) — install with `sudo apt install gh`)

### Step 2 — Deploy backend on Render

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Root directory:** `backend`
   - **Build command:** `pip install -r requirements.txt && python manage.py migrate && python manage.py seed_data`
   - **Start command:** `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
4. Add env var: `DEBUG = 0`, `SECRET_KEY = <any random string>`
5. Deploy and note the URL, e.g. `https://taskflow-backend.onrender.com`

### Step 3 — Deploy frontend on Render

1. **New → Static Site**
2. Settings:
   - **Root directory:** `frontend`
   - **Build command:** `npm install && npm run build`
   - **Publish directory:** `dist`
3. Add env var: `VITE_API_URL = https://taskflow-backend.onrender.com/api`
4. Deploy — available at e.g. `https://taskflow-frontend.onrender.com`

### Step 4 — Allow CORS (so frontend can call backend)

In your backend Render service → Environment:
- Set `CORS_ALLOW_ALL_ORIGINS = 0`
- Set `CORS_ALLOWED_ORIGINS = https://taskflow-frontend.onrender.com`

Then redeploy the backend.

> **Shortcut:** The `render.yaml` in the repo root is a Render Blueprint. You can use **New → Blueprint** and point it at the repo — but you'll still need to fill in the two URL env vars after both services deploy (chicken-and-egg).

---

## Decisions & Assumptions

- **Columns are fixed** (To Do / In Progress / Done). Creating a board auto-generates all three. The assignment didn't require custom column names.
- **Move via buttons**, not drag-and-drop. The assignment explicitly said "a working dropdown beats a broken drag-and-drop."
- **Search is implemented** as both a backend query param (`?search=`) and a debounced frontend input — qualifies as the optional stretch goal.
- **SQLite in Docker** uses a volume mount so data survives container restarts.
- **CORS** is wide-open in dev (`CORS_ALLOW_ALL_ORIGINS=1`) and restricted by origin in production.

## What I'd improve with more time

- Replace SQLite with Postgres on Render (SQLite on Render's ephemeral disk doesn't survive deploys)
- Add drag-and-drop using `@dnd-kit`
- Add proper pagination for large boards
- Replace `window.confirm` for delete with an inline confirmation modal
- Write end-to-end tests with Playwright

## Roughly how long

About **4–5 hours** total: ~2h backend, ~2h frontend UI/UX, ~1h Docker + Render setup.

## One thing I found interesting

Django's `Q` objects for combining OR filters (`Q(title__icontains=...) | Q(description__icontains=...)`) generate a single SQL `WHERE ... OR ...` clause under the hood — the ORM doesn't fetch everything and filter in Python, which is what the assignment specifically wanted to confirm. Running `queryset.query` to print the raw SQL and verify this was a useful sanity check.
