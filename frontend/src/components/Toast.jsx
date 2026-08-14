import { useEffect, useCallback, useState } from 'react';

/**
 * Toast notification system.
 * Usage:
 *   const { toasts, addToast, removeToast } = useToasts();
 *   addToast('Something went wrong', 'error');
 *   addToast('Saved!', 'success');
 */
export function useToasts() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'error') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

const ICONS = { error: '✕', success: '✓' };

/**
 * ToastContainer renders all active toasts at the top-center of the screen.
 */
export function ToastContainer({ toasts, removeToast }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container" role="alert" aria-live="assertive">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-icon">{ICONS[t.type]}</span>
          <span className="toast-msg">{t.message}</span>
          <button className="toast-close" onClick={() => removeToast(t.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}
