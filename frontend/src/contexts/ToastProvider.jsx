import React, { createContext, useState, useCallback } from 'react';
import Toast from '../components/Toast';

export const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showError = useCallback((message) => {
    addToast(message, 'error');
  }, [addToast]);

  const showWarning = useCallback((message) => {
    addToast(message, 'warning');
  }, [addToast]);

  const showInfo = useCallback((message) => {
    addToast(message, 'info');
  }, [addToast]);

  const value = {
    addToast,
    showError,
    showWarning,
    showInfo
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[1100]">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};