import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DOMPurify from "dompurify";
import styles from "./ResultCards.module.css";

export default function ResultCards({ categorie }) {
  const [data, setData] = useState(null);
  const [openIndex, setOpenIndex] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/data/db.json");
        if (!res.ok) throw new Error("Impossible de charger /data/db.json");
        const json = await res.json();
        if (alive) setData(json.contenuIMC || {});
      } catch (e) {
        if (alive) setError(e.message);
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    setOpenIndex(null);
  }, [categorie]);

  if (error) return <p style={{ color: "crimson" }}>{error}</p>;
  if (!categorie || !data) return null;

  const blocs = data[categorie];
  if (!blocs || !Array.isArray(blocs)) return null;

  const meaning = [];
  const advice = [];
  blocs.forEach((b) => {
    const t = (b.intro || "").toLowerCase();
    if (t.includes("l'imc")) meaning.push(b);
    else advice.push(b);
  });
  const leftBlocs = meaning.length ? meaning : blocs.filter((_, i) => i % 2 === 0);
  const rightBlocs = advice.length ? advice : blocs.filter((_, i) => i % 2 === 1);

  const ordered = [];
  const maxLen = Math.max(leftBlocs.length, rightBlocs.length);
  for (let i = 0; i < maxLen; i++) {
    if (leftBlocs[i]) ordered.push({ item: leftBlocs[i], side: 'left' });
    if (rightBlocs[i]) ordered.push({ item: rightBlocs[i], side: 'right' });
  }

  const toggle = (idx) => setOpenIndex(openIndex === idx ? null : idx);

  return (
    <section className={styles.wrapper}>
      <h3 className={styles.colTitle}>
        Que Signifie mon IMC ?
      </h3>
      <h3 className={styles.colTitle}>
        Conseil & Objectif !
      </h3>

      {ordered.map((entry, idx) => (
        <div key={idx} className={`${styles.bloc} ${entry.side === 'left' ? styles.left : styles.right}`}>
          <p dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(entry.item.intro) }} />

          <div className={`${styles.moreContent} ${openIndex === idx ? styles.moreContentOpen : ""}`}>
            <p dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(entry.item.more) }} />
            {entry.item.link && (
              <Link to={entry.item.link} className={styles.ctaLink} aria-label={`Aller vers ${entry.item.link}`}>
                Découvrir l'outil
              </Link>
            )}
          </div>

          <button className={styles.learnMore} onClick={() => toggle(idx)} aria-expanded={openIndex === idx}>
            {openIndex === idx ? "Lire moins" : "Lire plus"}
          </button>
        </div>
      ))}
    </section>
  );
}