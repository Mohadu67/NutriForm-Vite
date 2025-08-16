

import { useEffect, useRef } from "react";
import styles from "./ImcGraph.module.css";

const palette = {
  maigreur: "#4aa8ff",
  normal: "#2ecc71",
  surpoids: "#ffae42",
  obesite: "#ff5252",
};

const getCategory = (val) => {
  if (val < 18.5) return "maigreur";
  if (val <= 24.9) return "normal";
  if (val <= 29.9) return "surpoids";
  return "obesite";
};

export default function ImcGraph({ imc, visible = true, scrollOnShow = false }) {
  const min = 15, max = 40;
  const toNumber = (x) => (x === null || x === undefined || x === "") ? min : Number(x);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const vRaw = clamp(toNumber(imc), min, max);
  const v = Math.round(vRaw * 10) / 10;
  const pos = ((v - min) / (max - min)) * 100;
  const cat = getCategory(v);
  const catColor = palette[cat];

  const wrapRef = useRef(null);
  useEffect(() => {
    if (visible && scrollOnShow && wrapRef.current) {
      // petit delay pour laisser le DOM peindre
      const t = setTimeout(() => {
        wrapRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
      return () => clearTimeout(t);
    }
  }, [visible, scrollOnShow]);

  return (
    <div
      ref={wrapRef}
      className={styles.imcCard}
      style={{
        "--imc-pos": `${pos}%`,
        "--cat-color": catColor,
        display: visible ? undefined : "none"
      }}
    >
      <div className={styles.header}>
        <div className={styles.title}>Indice de Masse Corporelle</div>
        <div className={styles.value}>{v.toFixed(1)}</div>
      </div>

      <div className={styles.trackWrap}>
        <div className={styles.ticks}>
          <span>15</span><span>20</span><span>25</span><span>30</span><span>40</span>
        </div>
        <div className={styles.track} />
        <div className={styles.trackGlow} />
      </div>

      <div className={styles.badges}>
        <div className={styles.badge} data-key="maigreur" data-state={cat==="maigreur"?"active":"idle"}>Maigreur</div>
        <div className={styles.badge} data-key="normal" data-state={cat==="normal"?"active":"idle"}>Normal</div>
        <div className={styles.badge} data-key="surpoids" data-state={cat==="surpoids"?"active":"idle"}>Surpoids</div>
        <div className={styles.badge} data-key="obesite" data-state={cat==="obesite"?"active":"idle"}>Obésité</div>
      </div>
    </div>
  );
}