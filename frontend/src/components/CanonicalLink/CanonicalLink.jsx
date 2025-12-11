import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

function CanonicalLink() {
  const location = useLocation();
  const baseUrl = "https://harmonith.fr";

  // Retirer le trailing slash pour une URL cohérente
  let pathname = location.pathname.replace(/\/$/, '') || '/';

  // Remplacer /calories par /calorie pour la version canonique
  pathname = pathname === '/calories' ? '/calorie' : pathname;

  // Pour /outils avec paramètres tool=imc ou tool=cal, rediriger vers /imc ou /calorie
  if (pathname === '/outils' && location.search) {
    const params = new URLSearchParams(location.search);
    const tool = params.get('tool');
    if (tool === 'imc') {
      pathname = '/imc';
    } else if (tool === 'cal') {
      pathname = '/calorie';
    }
  }

  // Ne jamais inclure les paramètres de recherche dans l'URL canonique
  const canonicalUrl = `${baseUrl}${pathname === '/' ? '/' : pathname}`;

  return (
    <Helmet>
      <link rel="canonical" href={canonicalUrl} />
    </Helmet>
  );
}

export default CanonicalLink;