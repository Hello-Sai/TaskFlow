import { useState, useEffect, useCallback } from 'react';
import { fetchBoards, fetchTasks } from './api/client';
import KanbanBoard from './components/KanbanBoard';
import NewBoardModal from './components/NewBoardModal';
import { useToasts, ToastContainer } from './components/Toast';

export default function App() {
  const [boards, setBoards] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeBoardId, setActive] = useState(null);
  const [showNewBoard, setShowNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(
    () => localStorage.getItem('tf-theme') || 'dark'
  );

  const { toasts, addToast, removeToast } = useToasts();

  // ── Apply theme to <html> ──────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tf-theme', theme);
  }, [theme]);

  // ── Load boards ────────────────────────────────────────────
  const loadBoards = useCallback(async () => {
    try {
      const data = await fetchBoards();
      setBoards(data);
      // Select first board only on very first load
      setActive((prev) => prev ?? (data.length > 0 ? data[0].id : null));
    } catch (e) {
      addToast('Could not load boards — server is not running', 'error');
    }
  }, [addToast]);

  // ── Load tasks ─────────────────────────────────────────────
  const loadTasks = useCallback(async () => {
    try {
      const data = await fetchTasks();
      setTasks(data);
    } catch (e) {
      addToast('Could not load tasks — please refresh.', 'error');
    }
  }, [addToast]);

  // ── Initial load ───────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    Promise.all([loadBoards(), loadTasks()]).finally(() => setLoading(false));
  }, []); // eslint-disable-line

  // ── Board created ──────────────────────────────────────────
  const handleBoardCreated = (board) => {
    setBoards((prev) => [...prev, board]);
    setActive(board.id);
    setShowNew(false);
    addToast(`Board "${board.title}" created!`, 'success');
  };

  const activeBoard = boards.find((b) => b.id === activeBoardId);

  return (
    <div className="app-layout">
      {/* ── Theme Toggle ────────────────────────────────────── */}
      <button
        id="theme-toggle"
        className="theme-toggle"
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* ── Toasts ──────────────────────────────────────────── */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          Task<span>Flow</span>
        </div>

        {boards.map((b) => (
          <button
            key={b.id}
            id={`board-${b.id}`}
            className={`board-item ${b.id === activeBoardId ? 'active' : ''}`}
            onClick={() => setActive(b.id)}
          >
            <span className="board-dot" />
            {b.title}
          </button>
        ))}

        <button
          id="add-board-btn"
          className="add-board-btn"
          onClick={() => setShowNew(true)}
        >
          <span className="plus-icon">+</span>
          Board
        </button>
      </aside>

      {/* ── Main ────────────────────────────────────────────── */}
      <main className="main-content">
        {loading ? (
          <div className="spinner-wrap">
            <div className="spinner" />
          </div>
        ) : !activeBoard ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h2>No board selected</h2>
            <p>Create your first board using the <strong>+ Board</strong> button on the left.</p>
          </div>
        ) : (
          <>
            <div className="board-header">
              <h1 className="board-title">{activeBoard.title}</h1>
              <p className="board-subtitle">
                {tasks.filter((t) => t.board_id === activeBoard.id).length} tasks total
              </p>
            </div>
            <KanbanBoard
              board={activeBoard}
              tasks={tasks}
              onTasksChanged={loadTasks}
              addToast={addToast}
            />
          </>
        )}
      </main>

      {/* ── New Board Modal ──────────────────────────────────── */}
      {showNewBoard && (
        <NewBoardModal
          onClose={() => setShowNew(false)}
          onCreated={handleBoardCreated}
          addToast={addToast}
        />
      )}
    </div>
  );
}
