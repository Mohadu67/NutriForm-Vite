import { useState, useEffect } from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { useTranslation } from "react-i18next";
import styles from "./Newsletter.module.css";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const RECAPTCHA_ENABLED = import.meta.env.VITE_ENABLE_RECAPTCHA !== 'false' && import.meta.env.VITE_ENABLE_RECAPTCHA !== '0';

export default function Newsletter() {
  const { t } = useTranslation();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [message, setMessage] = useState("");
  const [captchaReady, setCaptchaReady] = useState(false);

  useEffect(() => {
    if (executeRecaptcha) {
      setCaptchaReady(true);
    }
  }, [executeRecaptcha]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setStatus("error");
      setMessage(t('newsletter.errorInvalidEmail') || "Format d'email invalide. Vérifie ton adresse email.");
      return;
    }

    if (RECAPTCHA_ENABLED && (!executeRecaptcha || !captchaReady)) {
      setStatus("error");
      setMessage("Protection anti-spam en cours de chargement... Veuillez réessayer dans un instant.");
      return;
    }

    setStatus("loading");

    try {
      // Obtenir le token reCAPTCHA
      const captchaToken = RECAPTCHA_ENABLED && executeRecaptcha
        ? await executeRecaptcha('newsletter_subscribe')
        : null;

      const endpoint = API_URL ? `${API_URL}/api/newsletter/subscribe` : "/api/newsletter/subscribe";
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
        setMessage(t('newsletter.successMessage'));
        setEmail("");

        // Reset après 5 secondes
        setTimeout(() => {
          setStatus("idle");
          setMessage("");
        }, 5000);
      } else {
        setStatus("error");
        setMessage(data.message || t('newsletter.errorGeneric'));
      }
    } catch (error) {
      setStatus("error");
      setMessage(t('newsletter.errorNetwork'));
    }
  };

  return (
    <section className={styles.newsletter}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.textBlock}>
            <span className={styles.badge}>{t('newsletter.badge')}</span>
            <h2 className={styles.title}>
              {t('newsletter.title')}
            </h2>
            <p className={styles.description}>
              {t('newsletter.description')}
            </p>
            <div className={styles.features}>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>✨</span>
                <span>{t('newsletter.feature1')}</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>💡</span>
                <span>{t('newsletter.feature2')}</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>🎁</span>
                <span>{t('newsletter.feature3')}</span>
              </div>
            </div>
          </div>

          <div className={styles.formBlock}>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <input
                  type="email"
                  placeholder={t('newsletter.placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  disabled={status === "loading" || status === "success"}
                  aria-label={t('newsletter.ariaLabel')}
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
                    t('newsletter.buttonSuccess')
                  ) : (
                    t('newsletter.buttonSubscribe')
                  )}
                </button>
              </div>

              {message && (
                <div className={`${styles.message} ${styles[status]}`}>
                  {message}
                </div>
              )}

              <p className={styles.privacy}>
                {t('newsletter.privacy')}
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
