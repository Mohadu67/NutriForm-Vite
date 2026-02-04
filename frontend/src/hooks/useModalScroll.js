import { useEffect } from 'react';

/**
 * Hook pour gérer le scroll du body quand une modale est ouverte
 * Empêche le scroll de la page en arrière-plan et restaure la position
 *
 * @param {boolean} isOpen - État d'ouverture de la modale
 */
export function useModalScroll(isOpen) {
  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    const originalStyle = {
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
    };

    // Bloquer le scroll
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    // Restaurer au unmount
    return () => {
      Object.entries(originalStyle).forEach(([key, value]) => {
        document.body.style[key] = value;
      });
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);
}
