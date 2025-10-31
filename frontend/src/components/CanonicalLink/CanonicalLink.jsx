import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

function CanonicalLink() {
  const location = useLocation();
  const baseUrl = "https://harmonith.fr";

  // Retirer le trailing slash pour une URL cohérente
  const pathname = location.pathname.replace(/\/$/, '') || '/';

  // Remplacer /calories par /calorie pour la version canonique
  const canonicalPath = pathname === '/calories' ? '/calorie' : pathname;

  const canonicalUrl = `${baseUrl}${canonicalPath === '/' ? '/' : canonicalPath}`;

  return (
    <Helmet>
      <link rel="canonical" href={canonicalUrl} />
    </Helmet>
  );
}

export default CanonicalLink;