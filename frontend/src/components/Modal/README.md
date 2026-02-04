# Modales - Guide d'utilisation

Ce répertoire contient les composants de modales réutilisables du projet.

## Composants disponibles

### ErrorModal

Modale générique pour afficher les erreurs.

**Props:**
- `isOpen` (boolean) - État d'ouverture de la modale
- `onClose` (function) - Callback appelé à la fermeture
- `title` (string) - Titre de l'erreur (défaut: "Une erreur s'est produite")
- `message` (string) - Message d'erreur principal
- `details` (string, optionnel) - Détails techniques (affichés dans un `<details>`)
- `retryText` (string) - Texte du bouton retry (défaut: "Réessayer")
- `onRetry` (function, optionnel) - Callback pour réessayer l'action

**Exemple d'utilisation:**

```jsx
import ErrorModal from '@/components/Modal/ErrorModal';
import { useState } from 'react';

function MyComponent() {
  const [error, setError] = useState(null);

  const handleAction = async () => {
    try {
      await doSomething();
    } catch (err) {
      setError({
        title: 'Erreur de chargement',
        message: 'Impossible de charger les données',
        details: err.message
      });
    }
  };

  return (
    <>
      <button onClick={handleAction}>Action</button>

      <ErrorModal
        isOpen={!!error}
        title={error?.title}
        message={error?.message}
        details={error?.details}
        onClose={() => setError(null)}
        onRetry={handleAction}
      />
    </>
  );
}
```

### ConfirmModal

Modale de confirmation pour les actions importantes.

**Props:**
- `isOpen` (boolean) - État d'ouverture
- `onClose` (function) - Callback de fermeture
- `onConfirm` (function) - Callback de confirmation
- `title` (string) - Titre de la modale
- `message` (string) - Message à confirmer
- `confirmText` (string) - Texte du bouton de confirmation (défaut: "Confirmer")
- `cancelText` (string) - Texte du bouton d'annulation (défaut: "Annuler")
- `type` (string) - Type visuel: 'default', 'danger', 'warning'
- `showCancel` (boolean) - Afficher le bouton annuler (défaut: true)

**Exemple:**

```jsx
import ConfirmModal from '@/components/Modal/ConfirmModal';

<ConfirmModal
  isOpen={showConfirm}
  title="Supprimer la recette ?"
  message="Cette action est irréversible."
  confirmText="Supprimer"
  type="danger"
  onConfirm={handleDelete}
  onClose={() => setShowConfirm(false)}
/>
```

### SessionCongratsModal

Modale de félicitations après une session d'exercice.

## Hooks disponibles

### useModalScroll

Hook pour gérer automatiquement le blocage du scroll quand une modale est ouverte.

**Fonctionnalités:**
- Bloque le scroll du body
- Préserve la position de scroll
- Restaure automatiquement au unmount

**Exemple d'utilisation:**

```jsx
import { useModalScroll } from '@/hooks/useModalScroll';
import { createPortal } from 'react-dom';

function MyModal({ isOpen, onClose }) {
  useModalScroll(isOpen);  // ← Hook automatique

  if (!isOpen) return null;

  return createPortal(
    <div className="overlay">
      <div className="modal">
        {/* Contenu */}
      </div>
    </div>,
    document.body
  );
}
```

## Bonnes pratiques

### 1. Toujours utiliser createPortal

```jsx
import { createPortal } from 'react-dom';

return createPortal(
  <div className="modal">{/* ... */}</div>,
  document.body
);
```

**Pourquoi ?** Évite les problèmes de z-index et overflow: hidden des parents.

### 2. Utiliser useModalScroll

```jsx
import { useModalScroll } from '@/hooks/useModalScroll';

function MyModal({ isOpen, onClose }) {
  useModalScroll(isOpen);
  // ...
}
```

**Pourquoi ?** Évite la duplication de code et garantit un comportement cohérent.

### 3. Ajouter les attributs ARIA

```jsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Titre</h2>
  <p id="modal-description">Description</p>
</div>
```

**Pourquoi ?** Accessibilité pour les lecteurs d'écran.

### 4. Gérer la touche Escape

```jsx
useEffect(() => {
  if (!isOpen) return;

  const handleEscape = (e) => {
    if (e.key === 'Escape') onClose();
  };

  document.addEventListener('keydown', handleEscape);
  return () => document.removeEventListener('keydown', handleEscape);
}, [isOpen, onClose]);
```

### 5. Focus initial

```jsx
const buttonRef = useRef(null);

useEffect(() => {
  if (isOpen && buttonRef.current) {
    buttonRef.current.focus();
  }
}, [isOpen]);

return (
  <button ref={buttonRef}>Action</button>
);
```

## Structure CSS recommandée

```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.modal {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}
```

## Checklist pour créer une nouvelle modale

- [ ] Utiliser `createPortal` pour le rendu
- [ ] Ajouter `useModalScroll(isOpen)`
- [ ] Gérer la touche Escape
- [ ] Ajouter les attributs ARIA (`role="dialog"`, `aria-modal`, etc.)
- [ ] Implémenter le focus initial
- [ ] Tester au clavier (Tab, Escape)
- [ ] Tester avec un lecteur d'écran
- [ ] Responsive mobile
- [ ] Animations d'entrée/sortie

## Questions fréquentes

### Comment fermer la modale en cliquant sur l'overlay ?

```jsx
<div className="overlay" onClick={onClose}>
  <div className="modal" onClick={(e) => e.stopPropagation()}>
    {/* Contenu - ne ferme pas au clic */}
  </div>
</div>
```

### Comment empêcher la fermeture par Escape ?

```jsx
function MyModal({ isOpen, onClose, closeOnEscape = true }) {
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    // ...
  }, [isOpen, closeOnEscape]);
}
```

### Comment gérer plusieurs modales ouvertes ?

Utiliser un système de z-index incrémental ou un context provider pour gérer la pile de modales.

## Ressources

- [WAI-ARIA: Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [React Portals](https://react.dev/reference/react-dom/createPortal)
- [MDN: `<dialog>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog)
