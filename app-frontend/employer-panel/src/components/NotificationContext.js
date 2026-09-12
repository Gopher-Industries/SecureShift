import React, { createContext, useCallback, useContext, useState } from 'react';
import './Notification.css';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications((current) =>
      current.filter((notification) => notification.id !== id)
    );
  }, []);

  const showNotification = useCallback(
    (type, message, duration = 4000) => {
      const id = Date.now() + Math.random();

      setNotifications((current) => [
        ...current,
        {
          id,
          type,
          message,
        },
      ]);

      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }

      return id;
    },
    [removeNotification]
  );

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        removeNotification,
      }}
    >
      {children}

      <div
        className="global-notifications"
        aria-live="polite"
        aria-atomic="true"
      >
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      'useNotification must be used inside NotificationProvider'
    );
  }

  return context;
};

const Notification = ({ notification, onClose }) => {
  const { type, message } = notification;

  const notificationConfig = {
    success: {
      icon: '✓',
      label: 'Success',
    },
    error: {
      icon: '!',
      label: 'Error',
    },
    warning: {
      icon: '⚠',
      label: 'Warning',
    },
    info: {
      icon: 'i',
      label: 'Information',
    },
  };

  const config = notificationConfig[type] || notificationConfig.info;

  return (
    <div
      className={`global-notification global-notification--${type}`}
      role={type === 'error' ? 'alert' : 'status'}
    >
      <div className="global-notification__icon" aria-hidden="true">
        {config.icon}
      </div>

      <div className="global-notification__content">
        <strong>{config.label}</strong>
        <span>{message}</span>
      </div>

      <button
        type="button"
        className="global-notification__close"
        onClick={onClose}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};