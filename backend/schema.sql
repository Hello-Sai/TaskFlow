-- ────────────────────────────────────────────────────────────
-- TaskFlow Database Schema
-- Compatible with SQLite (and Postgres/MySQL with minor tweaks)
-- ────────────────────────────────────────────────────────────

-- A Board is the top-level container (like a Trello board)
CREATE TABLE IF NOT EXISTS boards (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT    NOT NULL
);

-- Each Board has exactly 3 Columns: ToDo, InProgress, Done
CREATE TABLE IF NOT EXISTS columns (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    title    TEXT    NOT NULL CHECK (title IN ('ToDo', 'InProgress', 'Done')),
    UNIQUE (board_id, title)   -- only one of each column type per board
);

-- Tasks live inside a Column and carry priority + timestamps
CREATE TABLE IF NOT EXISTS tasks (
    id          INTEGER  PRIMARY KEY AUTOINCREMENT,
    column_id   INTEGER  NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
    title       TEXT     NOT NULL,          -- required; empty string rejected at API layer
    description TEXT,                       -- optional
    priority    TEXT     NOT NULL DEFAULT 'medium'
                         CHECK (priority IN ('low', 'medium', 'high')),
    created_at  DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    updated_at  DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

-- ────────────────────────────────────────────────────────────
-- Query 1: Task count per column on a given board
-- (used for the count badge shown in each column header)
-- Replace ? with the board_id you want, e.g. 1
-- ────────────────────────────────────────────────────────────
-- SELECT
--     c.title        AS column_name,
--     COUNT(t.id)    AS task_count
-- FROM columns c
-- LEFT JOIN tasks t ON t.column_id = c.id
-- WHERE c.board_id = ?
-- GROUP BY c.id, c.title
-- ORDER BY c.title;


-- ────────────────────────────────────────────────────────────
-- Query 2: Tasks filtered by priority, newest first
-- (used by GET /api/tasks/?priority=high)
-- Replace ? with 'low', 'medium', or 'high'
-- ────────────────────────────────────────────────────────────
-- SELECT
--     t.id,
--     t.title,
--     t.description,
--     t.priority,
--     t.created_at,
--     c.title  AS column_name,
--     b.title  AS board_name
-- FROM tasks t
-- JOIN columns c ON t.column_id = c.id
-- JOIN boards  b ON c.board_id  = b.id
-- WHERE t.priority = ?
-- ORDER BY t.created_at DESC;
