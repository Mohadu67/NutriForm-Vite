import { Helmet } from "@dr.pogodin/react-helmet";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import OutilsCalcul from "./OutilsCalcul.jsx";

export default function PageOutils() {
  const toolsSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Outils de Calcul Fitness - Harmonith",
    "description": "Calculateurs fitness gratuits : IMC, besoins caloriques et 1RM",
    "url": "https://harmonith.fr/outils"
  };

  return (
    <>
      <Helmet>
        <title>Outils de Calcul Fitness Gratuits - Harmonith | IMC, Calories, 1RM</title>
        <meta name="description" content="Calculateurs fitness gratuits : IMC, besoins caloriques (Mifflin-St Jeor) et 1RM (7 formules scientifiques). Outils précis pour optimiser votre entraînement." />
        <meta property="og:title" content="Outils de Calcul Fitness Gratuits - Harmonith" />
        <meta property="og:description" content="Suite complète de calculateurs fitness gratuits pour optimiser votre entraînement et votre nutrition." />
        <meta property="og:url" content="https://harmonith.fr/outils" />
        <script type="application/ld+json">
          {JSON.stringify(toolsSchema)}
        </script>
      </Helmet>
      <Header />
      <OutilsCalcul />
      <Footer />
    </>
  );
}
