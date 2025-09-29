import { useState } from "react";
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
  const [showGraph, setShowGraph] = useState(false);

  return (
    <>
      <main className={styles.wrapper}>
          <FormImc onCalculate={(v, c) => { setImc(v); setCategorie(c); setShowGraph(true); }} />
          <ImcGraph imc={imc} categorie={categorie} visible={showGraph} scrollOnShow />
          <ResultCards categorie={categorie} />
          <ArticlesImc />
      </main>
    </>
  );
}