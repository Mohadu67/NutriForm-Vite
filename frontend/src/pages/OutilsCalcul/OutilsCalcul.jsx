import { useState } from "react";
import ImcPage from "../Imc/ImcPage.jsx";
import CaloriePage from "../Calorie/CaloriePage.jsx";
import RMPage from "../RM/RMPage.jsx";
import styles from "./OutilsCalcul.module.css";

export default function OutilsCalcul() {
  const [tab, setTab] = useState("imc");

  return (
    <main id="outils" className={styles.container}>
      <header className={styles.header}>
        <h2 style={{ margin: 0 }}>Outils de calcul</h2>
        <p style={{ margin: 0, color: "#666" }}>
          Trois outils essentiels pour ton entraînement et ta nutrition.
        </p>
      </header>

      <div className={styles.tabs}>
        <button
          type="button"
          onClick={() => setTab("imc")}
          aria-pressed={tab === "imc"}
          className={`${styles.tab} ${tab === "imc" ? styles.tabActive : ""}`}
        >
          IMC
        </button>
        <button
          type="button"
          onClick={() => setTab("cal")}
          aria-pressed={tab === "cal"}
          className={`${styles.tab} ${tab === "cal" ? styles.tabActive : ""}`}
        >
          Calories
        </button>
        <button
          type="button"
          onClick={() => setTab("rm")}
          aria-pressed={tab === "rm"}
          className={`${styles.tab} ${tab === "rm" ? styles.tabActive : ""}`}
        >
          1RM
        </button>
      </div>

      <section className={styles.panel}>
        {tab === "imc" ? (
          <ImcPage />
        ) : tab === "cal" ? (
          <CaloriePage />
        ) : (
          <RMPage />
        )}
      </section>
    </main>
  );
}