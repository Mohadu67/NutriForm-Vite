import { useState } from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import styles from "./Newsletter.module.css";

export default function Newsletter() {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setStatus("error");
      setMessage("Merci d'entrer une adresse email valide");
      return;
    }

    if (!executeRecaptcha) {
      setStatus("error");
      setMessage("reCAPTCHA non chargé. Réessaye.");
      return;
    }

    setStatus("loading");

    try {
      // Obtenir le token reCAPTCHA
      const captchaToken = await executeRecaptcha('newsletter_subscribe');

      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, captchaToken }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage("Merci ! Tu es maintenant inscrit(e) à notre newsletter 🎉");
        setEmail("");

        // Reset après 5 secondes
        setTimeout(() => {
          setStatus("idle");
          setMessage("");
        }, 5000);
      } else {
        setStatus("error");
        setMessage(data.message || "Une erreur est survenue. Réessaye plus tard.");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Impossible de s'inscrire pour le moment. Vérifie ta connexion.");
    }
  };

  return (
    <section className={styles.newsletter}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.textBlock}>
            <span className={styles.badge}>Newsletter</span>
            <h2 className={styles.title}>
              Reste dans la boucle 💌
            </h2>
            <p className={styles.description}>
              Reçois nos nouveautés, conseils fitness et astuces pour progresser directement dans ta boîte mail.
              Promis, pas de spam, que du contenu utile !
            </p>
            <div className={styles.features}>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>✨</span>
                <span>Nouveaux exercices</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>💡</span>
                <span>Conseils d'experts</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>🎁</span>
                <span>Offres exclusives</span>
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
                  aria-label="Adresse email"
                />
                <button
                  type="submit"
                  className={styles.button}
                  disabled={status === "loading" || status === "success"}
                >
                  {status === "loading" ? (
                    <span className={styles.spinner}></span>
                  ) : status === "success" ? (
                    "✓ Inscrit !"
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
                🔒 Tes données sont protégées. Désinscris-toi quand tu veux.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}