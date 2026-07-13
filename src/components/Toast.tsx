import React from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning';
  show: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, type, show }) => {
  return (
    <div
      className={`toast ${type} ${show ? 'show' : ''}`}
      style={{
        position: 'fixed',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '14px 28px',
        borderRadius: '10px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
        zIndex: 1000,
        display: show ? 'block' : 'none',
        fontWeight: 500,
        color: 'white',
      }}
    >
      {message}
    </div>
  );
};
