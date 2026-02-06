import { Navigate } from 'react-router-dom';
import { storage } from '../../shared/utils/storage';

/**
 * Composant pour protéger les routes nécessitant une authentification
 * Redirige vers /login si l'utilisateur n'est pas connecté
 */
function ProtectedRoute({ children, requireAdmin = false }) {
  const user = storage.get('user');
  const token = storage.get('token');

  // Vérifier si l'utilisateur est connecté
  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  // Vérifier si l'accès admin est requis
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
