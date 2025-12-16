import React from 'react';
import { toast } from 'sonner';

/**
 * Affiche une confirmation élégante avec Sonner
 * @param {string} message - Le message de confirmation
 * @param {object} options - Options { title, confirmText, cancelText, type }
 * @returns {Promise<boolean>} - true si confirmé, false si annulé
 */
export function confirmDialog(message, options = {}) {
  const {
    title = 'Confirmation',
    confirmText = 'Confirmer',
    cancelText = 'Annuler',
    type = 'warning' // 'success', 'error', 'warning', 'info'
  } = options;

  return new Promise((resolve) => {
    toast.custom(
      (t) => (
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          maxWidth: '400px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '8px',
            color: '#1a1a1a'
          }}>
            {title}
          </div>
          <div style={{
            fontSize: '14px',
            color: '#666',
            marginBottom: '20px',
            lineHeight: '1.5'
          }}>
            {message}
          </div>
          <div style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={() => {
                toast.dismiss(t);
                resolve(false);
              }}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                background: 'white',
                color: '#666',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'white';
              }}
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                toast.dismiss(t);
                resolve(true);
              }}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: type === 'error' || type === 'warning'
                  ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        position: 'top-center'
      }
    );
  });
}

/**
 * Affiche un message de succès
 */
export function showSuccess(message, duration = 3000) {
  toast.success(message, { duration });
}

/**
 * Affiche un message d'erreur
 */
export function showError(message, duration = 4000) {
  toast.error(message, { duration });
}

/**
 * Affiche un message d'information
 */
export function showInfo(message, duration = 3000) {
  toast.info(message, { duration });
}
