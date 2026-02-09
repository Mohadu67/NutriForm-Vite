import { Navigate } from 'react-router-dom';
import { storage } from '../../shared/utils/storage';

/**
 * Composant pour protéger les routes nécessitant une authentification
 * Redirige vers /login si l'utilisateur n'est pas connecté
 * Redirige vers /pricing si premium requis mais pas actif
 *
 * Note de sécurité : Le token JWT est stocké dans un cookie httpOnly (sécurisé contre XSS)
 * et n'est PAS accessible depuis JavaScript. Le backend vérifie automatiquement le cookie.
 * On vérifie seulement le 'user' en localStorage pour l'UI, pas le token.
 */
function ProtectedRoute({ children, requireAdmin = false, requirePremium = false }) {
  const user = storage.get('user');
  const subscriptionStatus = storage.get('subscriptionStatus');

  // Vérifier si l'utilisateur est connecté
  // Le token JWT est dans un cookie httpOnly (pas accessible en JS) - le backend le vérifie
  if (!user) {
    return <Navigate to="/" replace state={{ openLogin: true }} />;
  }

  // Vérifier si l'accès admin est requis
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Vérifier si le premium est requis
  if (requirePremium) {
    const isPremium = subscriptionStatus?.tier === 'premium' ||
                     subscriptionStatus?.hasSubscription === true ||
                     user.isPremium === true;

    if (!isPremium) {
      return <Navigate to="/pricing" replace state={{ from: window.location.pathname }} />;
    }
  }

  return children;
}

export default ProtectedRoute;
