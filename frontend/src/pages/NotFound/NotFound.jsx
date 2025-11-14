import { Link, useNavigate } from "react-router-dom";
import styles from "./NotFound.module.css";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <main className={styles.container} aria-labelledby="nf-title">
      <div className={styles.card}>
        <div className={styles.illustration} aria-hidden="true">
          {}
          <svg viewBox="0 0 200 160" className={styles.svg}>
            <defs>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
              </filter>
            </defs>

            {}
            <ellipse cx="100" cy="120" rx="60" ry="18" fill="#000" opacity="0.08" />
            <ellipse cx="100" cy="100" rx="55" ry="20" fill="#F7F6F2" filter="url(#shadow)" />
            <ellipse cx="100" cy="85" rx="40" ry="16" fill="#f7b186" />
            <ellipse cx="100" cy="70" rx="28" ry="12" fill="#b8ddd1" />

            {}
            <g className={styles.magnifier}>
              <circle cx="145" cy="55" r="12" fill="none" stroke="#2B2B2B" strokeWidth="3" />
              <line x1="153" y1="63" x2="165" y2="75" stroke="#2B2B2B" strokeWidth="3" strokeLinecap="round" />
            </g>

            {}
            <g className={styles.digits}>
              <text x="20" y="42" fontSize="32" fontFamily="Merriweather, serif" fill="#2B2B2B">4</text>
              <text x="90" y="38" fontSize="28" fontFamily="Merriweather, serif" fill="#2B2B2B">0</text>
              <text x="155" y="42" fontSize="32" fontFamily="Merriweather, serif" fill="#2B2B2B">4</text>
            </g>
          </svg>
        </div>

        <h1 id="nf-title" className={styles.title}>Oups… page introuvable</h1>
        <p className={styles.text}>
          La page que tu cherches a peut-être pris des vacances. Vérifie l’URL
          ou reviens à l’accueil.
        </p>

        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={() => navigate(-1)}>
            Retour
          </button>
          <Link to="/" className={styles.primary}>Aller à l’accueil</Link>
        </div>
      </div>
    </main>
  );
}