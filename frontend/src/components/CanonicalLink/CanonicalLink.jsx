import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";

// Utilise window.location au lieu de useLocation pour éviter les problèmes de contexte React Router sur Safari
function CanonicalLink() {
  const [canonicalUrl, setCanonicalUrl] = useState(null);

  useEffect(() => {
    // Exécuté uniquement côté client après le montage
    if (typeof window === 'undefined') return;

    const baseUrl = "https://harmonith.fr";
    let pathname = (window.location.pathname || '/').replace(/\/$/, '') || '/';
    const search = window.location.search || '';

    // Remplacer /calories par /calorie pour la version canonique
    if (pathname === '/calories') {
      pathname = '/calorie';
    }

    // Pour /outils avec paramètres tool=imc ou tool=cal, rediriger vers /imc ou /calorie
    if (pathname === '/outils' && search) {
      const params = new URLSearchParams(search);
      const tool = params.get('tool');
      if (tool === 'imc') {
        pathname = '/imc';
      } else if (tool === 'cal') {
        pathname = '/calorie';
      }
    }

    setCanonicalUrl(`${baseUrl}${pathname === '/' ? '/' : pathname}`);
  }, []);

  // Ne rien rendre tant que l'URL n'est pas calculée côté client
  if (!canonicalUrl) {
    return null;
  }

  return (
    <Helmet>
      <link rel="canonical" href={canonicalUrl} />
    </Helmet>
  );
}

export default CanonicalLink;