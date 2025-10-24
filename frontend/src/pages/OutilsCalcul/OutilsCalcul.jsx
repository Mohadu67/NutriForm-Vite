import { useMemo, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ImcPage from "../Imc/ImcPage.jsx";
import CaloriePage from "../Calorie/CaloriePage.jsx";
import RMPage from "../RM/RMPage.jsx";
import styles from "./OutilsCalcul.module.css";

const VALID_TABS = ["imc", "cal", "rm"];

export default function OutilsCalcul() {
  const location = useLocation();
  const navigate = useNavigate();

  const searchTab = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const requested = params.get("tool")?.toLowerCase();
    return VALID_TABS.includes(requested) ? requested : "imc";
  }, [location.search]);

  const [tab, setTab] = useState(searchTab);

  useEffect(() => {
    if (tab !== searchTab) {
      setTab(searchTab);
    }
  }, [searchTab, tab]);

  const updateRoute = (next) => {
    if (!VALID_TABS.includes(next)) return;
    setTab(next);
    const params = new URLSearchParams(location.search);
    params.set("tool", next);
    const nextSearch = `?${params.toString()}`;
    if (location.search !== nextSearch) {
      navigate(`${location.pathname}${nextSearch}`, { replace: false });
    }
  };

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
          onClick={() => updateRoute("imc")}
          aria-pressed={tab === "imc"}
          className={`${styles.tab} ${tab === "imc" ? styles.tabActive : ""}`}
        >
          IMC
        </button>
        <button
          type="button"
          onClick={() => updateRoute("cal")}
          aria-pressed={tab === "cal"}
          className={`${styles.tab} ${tab === "cal" ? styles.tabActive : ""}`}
        >
          Calories
        </button>
        <button
          type="button"
          onClick={() => updateRoute("rm")}
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
