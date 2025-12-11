import { useState } from "react";
import { Helmet } from "react-helmet-async";
import usePageTitle from "../../hooks/usePageTitle.js";
import FormImc from "./FormImc/FormImc.jsx";
import ResultCards from "./ResultCards/ResultCards.jsx";
import ImcGraph from "./Graph/ImcGraph.jsx";
import styles from "./ImcPage.module.css";
import ArticlesImc from "./ArticlesImc/ArticlesImc";


export default function ImcPage() {
  usePageTitle("IMC");
  const [imc, setImc] = useState(null);
  const [categorie, setCategorie] = useState(null);
  const [description, setDescription] = useState(null);
  const [conseil, setConseil] = useState(null);
  const [showGraph, setShowGraph] = useState(false);

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "Comment calculer son IMC (Indice de Masse Corporelle)",
    "description": "Guide complet pour calculer votre IMC et interpréter les résultats pour évaluer votre corpulence",
    "image": "https://harmonith.fr/og-image.png",
    "totalTime": "PT2M",
    "estimatedCost": {
      "@type": "MonetaryAmount",
      "currency": "EUR",
      "value": "0"
    },
    "tool": [
      {
        "@type": "HowToTool",
        "name": "Balance pour mesurer votre poids"
      },
      {
        "@type": "HowToTool",
        "name": "Mètre ruban ou toise pour mesurer votre taille"
      }
    ],
    "step": [
      {
        "@type": "HowToStep",
        "position": 1,
        "name": "Mesurez votre poids",
        "text": "Pesez-vous de préférence le matin à jeun, sans vêtements lourds. Notez votre poids en kilogrammes.",
        "url": "https://harmonith.fr/outils?tool=imc#step1"
      },
      {
        "@type": "HowToStep",
        "position": 2,
        "name": "Mesurez votre taille",
        "text": "Mesurez votre taille en vous tenant droit, pieds joints, contre un mur. Notez votre taille en centimètres ou mètres.",
        "url": "https://harmonith.fr/outils?tool=imc#step2"
      },
      {
        "@type": "HowToStep",
        "position": 3,
        "name": "Entrez vos données dans le calculateur",
        "text": "Renseignez votre poids en kg et votre taille en cm dans notre calculateur IMC gratuit.",
        "url": "https://harmonith.fr/outils?tool=imc#step3"
      },
      {
        "@type": "HowToStep",
        "position": 4,
        "name": "Consultez vos résultats",
        "text": "L'IMC est calculé automatiquement selon la formule : poids (kg) / taille (m)². Votre catégorie (maigreur, normal, surpoids, obésité) s'affiche avec des conseils personnalisés.",
        "url": "https://harmonith.fr/outils?tool=imc#step4"
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>Calculateur IMC Gratuit - Harmonith | Indice de Masse Corporelle</title>
        <meta name="description" content="Calculateur IMC (Indice de Masse Corporelle) gratuit et fiable. Évaluez votre corpulence en quelques secondes et recevez des conseils personnalisés selon votre catégorie." />
        <meta property="og:title" content="Calculateur IMC Gratuit - Harmonith" />
        <meta property="og:description" content="Calculez votre IMC gratuitement et découvrez si votre poids est adapté à votre taille avec des conseils personnalisés." />
        <meta property="og:url" content="https://harmonith.fr/outils?tool=imc" />
        <script type="application/ld+json">
          {JSON.stringify(howToSchema)}
        </script>
      </Helmet>
      <main className={styles.wrapper}>
          <FormImc onCalculate={(v, c, d, co) => {
            setImc(v);
            setCategorie(c);
            setDescription(d);
            setConseil(co);
            setShowGraph(true);
          }} />
          <ImcGraph imc={imc} categorie={categorie} description={description} conseil={conseil} visible={showGraph} scrollOnShow />
          <ResultCards categorie={categorie} />
          <ArticlesImc />
      </main>
    </>
  );
}