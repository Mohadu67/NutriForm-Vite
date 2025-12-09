import { toast } from 'sonner';

/**
 * Hook pour remplacer alert() et confirm()
 * Utilise sonner pour les toasts et retourne une fonction pour les confirmations
 */
export function useNotification() {
  /**
   * Affiche un message de succès
   * @param {string} message
   */
  const success = (message) => {
    toast.success(message, {
      duration: 3000,
      position: 'top-center'
    });
  };

  /**
   * Affiche un message d'erreur
   * @param {string} message
   */
  const error = (message) => {
    toast.error(message, {
      duration: 4000,
      position: 'top-center'
    });
  };

  /**
   * Affiche un message d'information
   * @param {string} message
   */
  const info = (message) => {
    toast.info(message, {
      duration: 3000,
      position: 'top-center'
    });
  };

  /**
   * Affiche un message d'avertissement
   * @param {string} message
   */
  const warning = (message) => {
    toast.warning(message, {
      duration: 3500,
      position: 'top-center'
    });
  };

  /**
   * Demande confirmation à l'utilisateur
   * Retourne une Promise qui résout à true si confirmé, false sinon
   * @param {string} message
   * @param {Object} options - Options personnalisées
   * @returns {Promise<boolean>}
   */
  const confirm = (message, options = {}) => {
    return new Promise((resolve) => {
      const {
        confirmText = 'Confirmer',
        cancelText = 'Annuler',
        title = 'Confirmation'
      } = options;

      // Utiliser toast.custom pour créer un toast de confirmation
      toast.custom(
        (t) => (
          <div
            style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              maxWidth: '400px',
              border: '1px solid #e5e7eb'
            }}
          >
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#111' }}>
              {title}
            </h3>
            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.9375rem', color: '#6b7280', lineHeight: '1.5' }}>
              {message}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  toast.dismiss(t);
                  resolve(false);
                }}
                style={{
                  padding: '0.625rem 1.25rem',
                  background: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '0.9375rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  color: '#374151'
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
                  padding: '0.625rem 1.25rem',
                  background: '#f7b186',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9375rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  color: '#111'
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
  };

  return {
    success,
    error,
    info,
    warning,
    confirm
  };
}
