import { useState, useEffect, useCallback, useRef } from 'react';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import { searchTasks } from '../api/client';

const COLUMN_META = {
  ToDo:       { label: 'To Do',       cls: 'column-todo',     badge: 'badge-todo',     accent: 'accent-todo',     addCls: 'add-task-btn-todo'     },
  InProgress: { label: 'In Progress', cls: 'column-progress', badge: 'badge-progress', accent: 'accent-progress', addCls: 'add-task-btn-progress' },
  Done:       { label: 'Done',        cls: 'column-done',     badge: 'badge-done',     accent: 'accent-done',     addCls: 'add-task-btn-done'     },
};

export default function KanbanBoard({ board, tasks, onTasksChanged, addToast }) {
  const [addingFor, setAddingFor]       = useState(null);
  const [searchQuery, setSearchQuery]   = useState('');
  const [priorityFilter, setPriority]   = useState('all');
  const [filteredTasks, setFiltered]    = useState(null); // null = no filter active
  const [searching, setSearching]       = useState(false);
  const debounceRef                     = useRef(null);

  const columns = board.columns;

  // ── Debounced backend search ────────────────────────────────
  const runSearch = useCallback(async (query, priority) => {
    const isDefault = !query && priority === 'all';
    if (isDefault) { setFiltered(null); return; }

    setSearching(true);
    try {
      const results = await searchTasks({
        search:   query,
        priority: priority !== 'all' ? priority : '',
        boardId:  board.id,
      });
      setFiltered(results);
    } catch (e) {
      addToast('Search failed — ' + e.message, 'error');
    } finally {
      setSearching(false);
    }
  }, [board.id, addToast]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(searchQuery, priorityFilter), 350);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery, priorityFilter, runSearch]);

  // Reset filtered when tasks reload from parent
  useEffect(() => {
    if (filteredTasks !== null) runSearch(searchQuery, priorityFilter);
  }, [tasks]); // eslint-disable-line

  // ── Display tasks = filtered (if active) else all board tasks
  const displayTasks = filteredTasks !== null ? filteredTasks : tasks.filter(t => t.board_id === board.id);
  const byCol = col => displayTasks.filter(t => t.column_name === col);

  const colOrder = ['ToDo', 'InProgress', 'Done'];

  return (
    <div className="board-view">
      {/* ── Search + Filter row ─────────────────────────────── */}
      <div className="search-filter-row">
        <div className="search-input-wrap">
          <span className="search-icon">⌕</span>
          <input
            id="task-search"
            className="search-input"
            type="text"
            placeholder="Search tasks…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searching && <span className="search-spinner" />}
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')} title="Clear search">✕</button>
          )}
        </div>

        <select
          id="priority-filter"
          className="filter-select"
          value={priorityFilter}
          onChange={e => setPriority(e.target.value)}
        >
          <option value="all">All Priorities</option>
          <option value="high">🔴 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">🟢 Low</option>
        </select>
      </div>

      {/* ── Kanban Columns ───────────────────────────────────── */}
      <div className="kanban-board">
        {colOrder.map(colTitle => {
          const meta     = COLUMN_META[colTitle];
          const colObj   = columns.find(c => c.title === colTitle);
          const colTasks = byCol(colTitle);

          return (
            <div key={colTitle} className={`column ${meta.cls}`}>
              <div className={`column-accent-bar ${meta.accent}`} />

              <div className="column-header">
                <span className={`column-badge ${meta.badge}`}>{meta.label}</span>
                <span className="column-count">{colTasks.length}</span>
              </div>

              <div className="column-tasks">
                {colTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    columns={columns}
                    onUpdated={onTasksChanged}
                    onDeleted={onTasksChanged}
                    addToast={addToast}
                  />
                ))}
              </div>

              {colObj && (
                <button
                  id={`add-task-${colTitle}`}
                  className={`add-task-btn ${meta.addCls}`}
                  onClick={() => setAddingFor(colTitle)}
                >
                  <span style={{ fontSize: '1rem', fontWeight: 800 }}>+</span> Task
                </button>
              )}
            </div>
          );
        })}
      </div>

      {addingFor && (
        <TaskModal
          columns={columns}
          defaultColumn={addingFor}
          onClose={() => setAddingFor(null)}
          onSaved={() => { setAddingFor(null); onTasksChanged(); addToast('Task created!', 'success'); }}
          addToast={addToast}
        />
      )}
    </div>
  );
}
