import { useState, useCallback } from 'react';
import { createTask, updateTask, deleteTask } from '../api/client';

const COLUMN_TYPES = ['ToDo', 'InProgress', 'Done'];

/**
 * Modal for creating OR editing a Task.
 * Props:
 *   columns        – array of column objects for this board { id, title }
 *   defaultColumn  – 'ToDo' | 'InProgress' | 'Done'  (for create mode)
 *   task           – existing task object (edit mode, optional)
 *   onClose()
 *   onSaved(task)  – called with updated/created task
 */
export default function TaskModal({ columns, defaultColumn, task, onClose, onSaved, onDeleted, addToast }) {
  const isEdit = Boolean(task);

  const defaultColObj = columns.find((c) => c.title === defaultColumn) || columns[0];
  const [title, setTitle]       = useState(task?.title ?? '');
  const [description, setDesc]  = useState(task?.description ?? '');
  const [priority, setPriority] = useState(task?.priority ?? 'medium');
  const [columnId, setColumnId] = useState(task?.column ?? defaultColObj?.id ?? '');
  const [loading, setLoading]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError]       = useState('');

  const handleSave = useCallback(async () => {
    if (!title.trim()) { setError('Task title is required'); return; }
    if (!columnId)     { setError('Please select a column'); return; }
    setLoading(true);
    setError('');
    try {
      let saved;
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        column: Number(columnId),
      };
      if (isEdit) {
        saved = await updateTask(task.id, payload);
      } else {
        saved = await createTask(payload);
      }
      onSaved(saved);
    } catch (e) {
      addToast?.('Failed to save task — ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [title, description, priority, columnId, isEdit, task, onSaved, addToast]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm(`Delete "${task?.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteTask(task.id);
      addToast?.('Task deleted', 'success');
      onDeleted?.();
      onClose();
    } catch (e) {
      addToast?.('Failed to delete task — ' + e.message, 'error');
    } finally {
      setDeleting(false);
    }
  }, [task, onDeleted, onClose, addToast]);

  const accentColors = {
    ToDo:       '#e74c8b',
    InProgress: '#f5a623',
    Done:       '#2ecc71',
  };

  const selectedColTitle = columns.find((c) => c.id === Number(columnId))?.title || defaultColumn;
  const accent = accentColors[selectedColTitle] || '#5b6ef5';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* Accent bar matches column color */}
        <div style={{
          height: 3,
          borderRadius: '18px 18px 0 0',
          background: `linear-gradient(90deg, ${accent}, ${accent}88)`,
          margin: '-30px -28px 24px',
        }} />

        <div className="modal-header">
          <span className="modal-title">{isEdit ? '✎ Edit Task' : '+ New Task'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Title */}
        <div className="form-group">
          <label className="form-label">Title</label>
          <input
            id="task-title-input"
            className="form-input"
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            id="task-desc-input"
            className="form-textarea"
            placeholder="Add details (optional)…"
            value={description}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>

        {/* Priority */}
        <div className="form-group">
          <label className="form-label">Priority</label>
          <select
            id="task-priority-select"
            className="form-select"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="low">🟢 Low</option>
            <option value="medium">🟡 Medium</option>
            <option value="high">🔴 High</option>
          </select>
        </div>

        {/* Column */}
        <div className="form-group">
          <label className="form-label">Column</label>
          <select
            id="task-column-select"
            className="form-select"
            value={columnId}
            onChange={(e) => setColumnId(e.target.value)}
          >
            {columns.map((col) => (
              <option key={col.id} value={col.id}>
                {col.title === 'ToDo' ? '🔴 To Do' :
                 col.title === 'InProgress' ? '🟡 In Progress' : '🟢 Done'}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p style={{ fontSize: '0.78rem', color: '#e74c8b', marginBottom: 12 }}>{error}</p>
        )}

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          {isEdit && (
            <button
              id="delete-task-btn"
              className="btn-delete"
              onClick={handleDelete}
              disabled={deleting || loading}
            >
              {deleting ? '…' : '🗑 Delete'}
            </button>
          )}
          <button
            id="save-task-btn"
            className="btn-save"
            onClick={handleSave}
            disabled={loading || deleting}
          >
            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
