import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/ui/Toast';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toastConfig, setToastConfig] = useState({
    visible: false,
    type: 'message',
    title: '',
    message: '',
    avatar: null,
    isOnline: undefined,
    onPress: null,
  });

  const showToast = useCallback(({
    type = 'message',
    title,
    message,
    avatar,
    isOnline,
    onPress,
    duration = 4000,
  }) => {
    setToastConfig({
      visible: true,
      type,
      title,
      message,
      avatar,
      isOnline,
      onPress,
      duration,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToastConfig(prev => ({ ...prev, visible: false }));
  }, []);

  // Raccourci pour les notifications de message
  const showMessageNotification = useCallback(({
    senderName,
    senderAvatar,
    messagePreview,
    isOnline,
    onPress,
  }) => {
    showToast({
      type: 'message',
      title: senderName,
      message: messagePreview,
      avatar: senderAvatar,
      isOnline,
      onPress,
      duration: 4000,
    });
  }, [showToast]);

  // Raccourci pour les notifications de succes
  const showSuccess = useCallback((title, message) => {
    showToast({
      type: 'success',
      title,
      message,
      duration: 3000,
    });
  }, [showToast]);

  // Raccourci pour les notifications d'erreur
  const showError = useCallback((title, message) => {
    showToast({
      type: 'error',
      title,
      message,
      duration: 4000,
    });
  }, [showToast]);

  // Raccourci pour les notifications d'info
  const showInfo = useCallback((title, message) => {
    showToast({
      type: 'info',
      title,
      message,
      duration: 3500,
    });
  }, [showToast]);

  const value = {
    showToast,
    hideToast,
    showMessageNotification,
    showSuccess,
    showError,
    showInfo,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast
        visible={toastConfig.visible}
        type={toastConfig.type}
        title={toastConfig.title}
        message={toastConfig.message}
        avatar={toastConfig.avatar}
        isOnline={toastConfig.isOnline}
        onPress={toastConfig.onPress}
        onDismiss={hideToast}
        duration={toastConfig.duration}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastContext;
