import { useState, useEffect } from "react";
import { storage } from '../../shared/utils/storage';
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import styles from "./Newsletter.module.css";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const RECAPTCHA_ENABLED = import.meta.env.VITE_ENABLE_RECAPTCHA !== 'false' && import.meta.env.VITE_ENABLE_RECAPTCHA !== '0';

export default function Newsletter() {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [captchaReady, setCaptchaReady] = useState(false);
  const [isHidden, setIsHidden] = useState(() => {
    return storage.get("hideNewsletter") === "true";
  });

  useEffect(() => {
    if (executeRecaptcha) {
      setCaptchaReady(true);
    }
  }, [executeRecaptcha]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setStatus("error");
      setMessage("Format d'email invalide. Vérifie ton adresse email.");
      return;
    }

    if (RECAPTCHA_ENABLED && (!executeRecaptcha || !captchaReady)) {
      setStatus("error");
      setMessage("Protection anti-spam en cours de chargement... Veuillez réessayer dans un instant.");
      return;
    }

    setStatus("loading");

    try {
      
      const captchaToken = RECAPTCHA_ENABLED && executeRecaptcha
        ? await executeRecaptcha('newsletter_subscribe')
        : null;

      const endpoint = API_URL ? `${API_URL}/newsletter/subscribe` : "/newsletter/subscribe";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, captchaToken }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage("Merci ! Tu es maintenant inscrit à notre newsletter.");
        setEmail("");
        storage.set("hideNewsletter", "true");

        setTimeout(() => {
          setStatus("idle");
          setMessage("");
          setIsHidden(true);
        }, 2000);
      } else {
        setStatus("error");
        setMessage(data.message || "Une erreur est survenue. Réessaie plus tard.");
      }
    } catch {
      setStatus("error");
      setMessage("Erreur de connexion. Vérifie ta connexion internet.");
    }
  };

  if (isHidden) return null;

  return (
    <section className={styles.newsletter}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.textBlock}>
            <span className={styles.badge}>Newsletter</span>
            <h2 className={styles.title}>
              Reste motivé, inscris-toi à la newsletter
            </h2>
            <p className={styles.description}>
              Reçois nos meilleurs conseils fitness, des recettes saines et des offres exclusives directement dans ta boîte mail.
            </p>
            <div className={styles.features}>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>✨</span>
                <span>Conseils d'experts chaque semaine</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>💡</span>
                <span>Programmes d'entraînement exclusifs</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>🎁</span>
                <span>Offres spéciales réservées aux abonnés</span>
              </div>
            </div>
          </div>

          <div className={styles.formBlock}>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <input
                  type="email"
                  placeholder="ton@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  disabled={status === "loading" || status === "success"}
                  aria-label="Adresse email pour la newsletter"
                  required
                  pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                  title="Veuillez entrer une adresse email valide"
                />
                <button
                  type="submit"
                  className={styles.button}
                  disabled={status === "loading" || status === "success"}
                >
                  {status === "loading" ? (
                    <span className={styles.spinner}></span>
                  ) : status === "success" ? (
                    "Inscrit !"
                  ) : (
                    "S'inscrire"
                  )}
                </button>
              </div>

              {message && (
                <div className={`${styles.message} ${styles[status]}`}>
                  {message}
                </div>
              )}

              <p className={styles.privacy}>
                Tes données sont protégées. Tu peux te désinscrire à tout moment.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
