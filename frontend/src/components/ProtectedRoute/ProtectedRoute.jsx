import { Navigate } from 'react-router-dom';
import { storage } from '../../shared/utils/storage';

/**
 * Composant pour protéger les routes nécessitant une authentification
 * Redirige vers /login si l'utilisateur n'est pas connecté
 * Redirige vers /pricing si premium requis mais pas actif
 */
function ProtectedRoute({ children, requireAdmin = false, requirePremium = false }) {
  const user = storage.get('user');
  const token = storage.get('token');
  const subscriptionStatus = storage.get('subscriptionStatus');

  // Vérifier si l'utilisateur est connecté
  if (!user || !token) {
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
