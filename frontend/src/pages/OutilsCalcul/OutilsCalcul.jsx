import { useMemo, useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ImcPage from "../Imc/ImcPage.jsx";
import CaloriePage from "../Calorie/CaloriePage.jsx";
import RMPage from "../RM/RMPage.jsx";
import styles from "./OutilsCalcul.module.css";

const VALID_TABS = ["imc", "cal", "rm"];

export default function OutilsCalcul() {
  const location = useLocation();
  const navigate = useNavigate();
  const panelRef = useRef(null);

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

  useEffect(() => {
    if (typeof window === "undefined") return;

    const panel = panelRef.current;
    if (!panel) return;

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    const scrollTarget =
      panel.querySelector("form") ||
      panel.querySelector("[data-scroll-anchor='true']") ||
      panel;

    if (typeof scrollTarget.scrollIntoView !== "function") return;

    // defer to next frame to ensure layout is settled before scrolling
    const frame = window.requestAnimationFrame(() => {
      scrollTarget.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "center",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [tab]);

  return (
    <main id="outils" className={styles.container}>
      <header className={styles.header}>
        <h2 style={{ margin: 0 }}>Outils de calcul</h2>
        <p style={{ margin: 0, color: 'var(--muted, #666)' }}>
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

      <section ref={panelRef} className={styles.panel}>
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
