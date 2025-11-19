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
  const isInitialMount = useRef(true);

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

  // Scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.visible);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    document.querySelectorAll(`.${styles.fadeIn}`).forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

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
    // Skip scroll on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (typeof window === "undefined") return;

    const panel = panelRef.current;
    if (!panel) return;

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    const scrollTarget =
      panel.querySelector("form") ||
      panel.querySelector("[data-scroll-anchor='true']") ||
      panel;

    if (typeof scrollTarget.scrollIntoView !== "function") return;

    const frame = window.requestAnimationFrame(() => {
      scrollTarget.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "center",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [tab]);

  return (
    <main id="outils" className={styles.mainWrapper}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.badge}>Calculateurs</span>
          <h1 className={styles.heroTitle}>
            Mesure.
            <br />
            <span className={styles.highlight}>Progresse.</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Trois outils scientifiques pour optimiser ton entraînement et ta nutrition.
          </p>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.floatingOrb}></div>
          <div className={styles.floatingOrb}></div>
          <div className={styles.floatingOrb}></div>
        </div>
      </section>

      {/* Tools Section */}
      <section className={`${styles.toolsSection} ${styles.fadeIn}`}>
        <div className={styles.container}>
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

          <div ref={panelRef} className={styles.panel}>
            {tab === "imc" ? (
              <ImcPage />
            ) : tab === "cal" ? (
              <CaloriePage />
            ) : (
              <RMPage />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
