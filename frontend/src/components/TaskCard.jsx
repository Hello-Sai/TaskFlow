import { useState } from 'react';
import { updateTask } from '../api/client';
import TaskModal from './TaskModal';

const PRIORITY_LABEL = { low: 'Low', medium: 'Med', high: 'High' };

const COLUMN_NEXT_ACTIONS = {
  ToDo: [{ label: '▶', title: 'Mark In Progress', targetCol: 'InProgress', cls: 'btn-progress' }],
  InProgress: [
    { label: '↩', title: 'Move to To Do', targetCol: 'ToDo', cls: 'btn-todo' },
    { label: '✓', title: 'Mark as Done', targetCol: 'Done', cls: 'btn-done' },
  ],
  Done: [{ label: '↩', title: 'Move to In Progress', targetCol: 'InProgress', cls: 'btn-progress' }],
};

/**
 * Props:
 *   task       – task object
 *   columns    – all columns for this board
 *   onUpdated  – called after successful PATCH
 *   addToast   – (msg, type) toast function
 */
export default function TaskCard({ task, columns, onUpdated, onDeleted, addToast }) {
  const [showEdit, setShowEdit] = useState(false);
  const [bouncing, setBouncing] = useState(null);

  const currentColTitle = task.column_name;
  const actions = COLUMN_NEXT_ACTIONS[currentColTitle] || [];

  const bounce = (key, fn) => {
    setBouncing(key);
    setTimeout(() => { setBouncing(null); fn(); }, 150);
  };

  const moveTask = async (targetColTitle) => {
    const targetCol = columns.find((c) => c.title === targetColTitle);
    if (!targetCol) return;
    try {
      const updated = await updateTask(task.id, { column: targetCol.id });
      onUpdated(updated);
    } catch (e) {
      addToast(`Failed to move task — ${e.message}`, 'error');
    }
  };

  return (
    <>
      {/* ── Whole card is clickable to edit ── */}
      <div
        id={`task-${task.id}`}
        className="task-card"
        onClick={() => setShowEdit(true)}
      >
        {/* Tooltip shown on any card hover, not just title */}
        <div className="task-tooltip">✎ Click to edit/delete</div>

        <div className="task-label-row">
          <div className="task-title">{task.title}</div>

          {/* Action buttons — stop propagation so they don't open edit */}
          <div className="task-actions" onClick={(e) => e.stopPropagation()}>
            {actions.map((action) => (
              <button
                key={action.targetCol}
                id={`task-${task.id}-${action.targetCol}`}
                className={`task-action-btn ${action.cls}`}
                title={action.title}
                style={{
                  transform: bouncing === action.targetCol ? 'scale(0.82)' : undefined,
                  transition: bouncing === action.targetCol
                    ? 'transform 0.08s ease'
                    : 'all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
                onClick={() => bounce(action.targetCol, () => moveTask(action.targetCol))}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {task.description && <p className="task-desc">{task.description}</p>}

        <span className={`priority-badge priority-${task.priority}`}>
          {task.priority === 'high' ? '↑' : task.priority === 'medium' ? '→' : '↓'}{' '}
          {PRIORITY_LABEL[task.priority]}
        </span>
      </div>

      {showEdit && (
        <TaskModal
          columns={columns}
          defaultColumn={currentColTitle}
          task={task}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => { setShowEdit(false); onUpdated(updated); }}
          onDeleted={() => { setShowEdit(false); onDeleted?.(); }}
          addToast={addToast}
        />
      )}
    </>
  );
}
