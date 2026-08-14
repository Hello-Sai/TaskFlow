import { useState, useCallback } from 'react';
import { createBoard, fetchBoards } from '../api/client';

/**
 * Modal for creating a new Board.
 * Props:
 *   onClose()        – close without saving
 *   onCreated(board) – board object returned from API
 */
export default function NewBoardModal({ onClose, onCreated, addToast }) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = useCallback(async () => {
    if (!title.trim()) { setError('Board name is required'); return; }
    setLoading(true);
    setError('');
    try {
      const board = await createBoard(title.trim());
      onCreated(board);
    } catch (e) {
      addToast?.('Could not create board — server is not running', 'error');
    } finally {
      setLoading(false);
    }
  }, [title, onCreated]);

  const handleKey = (e) => { if (e.key === 'Enter') handleSave(); };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-board-accent" />
        <div className="modal-header">
          <span className="modal-title">✦ New Board</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="form-group">
          <label className="form-label">Board Name</label>
          <input
            id="new-board-title"
            className="form-input"
            placeholder="e.g. Sprint 1, Marketing, Personal…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKey}
            autoFocus
          />
        </div>

        {error && (
          <p style={{ fontSize: '0.78rem', color: '#e74c8b', marginBottom: 12 }}>
            {error}
          </p>
        )}

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button
            id="save-board-btn"
            className="btn-save"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Creating…' : 'Create Board'}
          </button>
        </div>
      </div>
    </div>
  );
}
