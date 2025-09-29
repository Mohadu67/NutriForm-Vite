import { Helmet } from "react-helmet-async";

function SeoSchema({
  links,
}) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://example.com";

  const navLinks = Array.isArray(links) && links.length > 0
    ? links
    : [
        { label: "S'entrainer", href: "/exo" },
        { label: "Calculez vos Calories", href: "/outils" },
        { label: "Calculez votre IMC", href: "/outils" },
        { label: "Nous contater", href: "/contact" },
      ];

  const siteNavigationSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: navLinks.map((l) => ({
      "@type": "SiteNavigationElement",
      name: l.label,
      url: `${origin}${l.href}`,
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(siteNavigationSchema)}</script>
    </Helmet>
  );
}

export default SeoSchema;