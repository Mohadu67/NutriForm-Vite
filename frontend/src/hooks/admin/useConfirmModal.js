import { useState, useCallback } from 'react';

export function useConfirmModal() {
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    type: 'default',
    onConfirm: () => {},
    onCancel: null,
  });

  const openModal = useCallback(({
    title,
    message,
    confirmText = 'Confirmer',
    cancelText = 'Annuler',
    type = 'default',
    onConfirm,
    onCancel = null,
  }) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      type,
      onConfirm,
      onCancel,
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleConfirm = useCallback(() => {
    modalConfig.onConfirm();
    closeModal();
  }, [modalConfig, closeModal]);

  const handleCancel = useCallback(() => {
    if (modalConfig.onCancel) modalConfig.onCancel();
    closeModal();
  }, [modalConfig, closeModal]);

  return { modalConfig, openModal, closeModal, handleConfirm, handleCancel };
}
