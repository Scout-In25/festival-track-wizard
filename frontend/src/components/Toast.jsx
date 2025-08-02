import React from 'react';

const Toast = ({ id, type, message, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [id, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return 'bg-red-100 text-red-700 border border-red-400';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 border border-yellow-400';
      case 'info':
        return 'bg-blue-100 text-blue-700 border border-blue-400';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-400';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`toast ${getTypeStyles()} rounded-lg shadow-lg p-4 mb-4 flex items-center justify-between min-w-[300px] max-w-md`}
      role="alert"
    >
      <div className="flex items-center">
        <span className="mr-3">{getIcon()}</span>
        <span className="text-sm font-medium">{message}</span>
      </div>
      <button
        onClick={() => onClose(id)}
        className="ml-4 bg-white text-gray-800 hover:bg-gray-200 focus:outline-none p-2 rounded border border-gray-300"
        style={{
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        aria-label="Close"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default Toast;