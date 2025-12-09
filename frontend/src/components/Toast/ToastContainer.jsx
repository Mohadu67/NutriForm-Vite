import { createContext, useContext, useState, useCallback } from 'react';
import Toast from './Toast';
import styles from './ToastContainer.module.css';

const ToastContext = createContext();

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast doit être utilisé dans un ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const toast = {
    success: (message) => addToast(message, 'success'),
    error: (message) => addToast(message, 'error'),
    info: (message) => addToast(message, 'info'),
    warning: (message) => addToast(message, 'warning'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className={styles.toastContainer}>
        {toasts.map(({ id, message, type }) => (
          <Toast
            key={id}
            message={message}
            type={type}
            onClose={() => removeToast(id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
