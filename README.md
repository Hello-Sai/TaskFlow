# TaskFlow - https://task-flow-1u1wk2pmq-hello-sais-projects.vercel.app/
## Assumptions
Since the instruction is not clear by just mentioning Python as backend, I had three options
1. Flask 2. Djanog 3.FastAPI

I chose django for reliablity and deploymnent

I Built with **Django REST Framework** (backend) and **React + Vite** (frontend).

---
## Deployed Version - https://task-flow-1u1wk2pmq-hello-sais-projects.vercel.app/


# To Setup the Project
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
## Running Server
Server Loads at 8000 port.

https://localhost:8000
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


