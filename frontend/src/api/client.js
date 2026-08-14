// Vite proxies /api → Django in dev. On Render, set VITE_API_URL to backend URL.
const API_BASE = import.meta.env.VITE_API_URL || '/api';

// ── Boards ────────────────────────────────────────────────────
export async function fetchBoards() {
  const res = await fetch(`${API_BASE}/boards/`);
  if (!res.ok) throw new Error('Failed to fetch boards');
  return res.json();
}

export async function createBoard(title) {
  const res = await fetch(`${API_BASE}/boards/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error('Failed to create board');
  return res.json();
}

// ── Tasks ─────────────────────────────────────────────────────
export async function fetchTasks() {
  const res = await fetch(`${API_BASE}/tasks/`);
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
}

/**
 * Search/filter tasks via backend query params.
 * @param {object} opts - { search, priority, boardId }
 */
export async function searchTasks({ search = '', priority = '', boardId = '' } = {}) {
  const params = new URLSearchParams();
  if (search)   params.set('search', search);
  if (priority) params.set('priority', priority);
  if (boardId)  params.set('board_id', boardId);
  const res = await fetch(`${API_BASE}/tasks/?${params}`);
  if (!res.ok) throw new Error('Failed to search tasks');
  return res.json();
}

export async function createTask(payload) {
  const res = await fetch(`${API_BASE}/tasks/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create task');
  return res.json();
}

export async function updateTask(id, payload) {
  const res = await fetch(`${API_BASE}/tasks/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update task');
  return res.json();
}

export async function deleteTask(id) {
  const res = await fetch(`${API_BASE}/tasks/${id}/`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete task');
}
