import React, { useState } from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import styles from "./FormContact.module.css";
import logoAnimate from "../../../assets/img/logo/logoAnimate.svg";
import BoutonAction from "../../../components/BoutonAction/BoutonAction.jsx";

const API_URL = import.meta.env.VITE_API_URL || "";
const RECAPTCHA_ENABLED = import.meta.env.VITE_ENABLE_RECAPTCHA !== 'false' && import.meta.env.VITE_ENABLE_RECAPTCHA !== '0';

export default function FormContact({ onSend }) {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [form, setForm] = useState({ nom: "", email: "", sujet: "", message: "", consent: false });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.nom.trim()) e.nom = "Ton nom est requis.";
    if (!form.email.trim()) e.email = "Ton email est requis.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email invalide.";
    if (!form.sujet.trim()) e.sujet = "Un sujet est requis.";
    if (!form.message.trim()) e.message = "Ton message est vide.";
    if (!form.consent) e.consent = "Merci d'accepter la politique de confidentialité.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const start = Date.now();
    if (!validate()) return;

    try {
      setStatus("sending");

      const captchaToken = RECAPTCHA_ENABLED && executeRecaptcha
        ? await executeRecaptcha('contact_form')
        : null;

      if (typeof onSend === "function") {
        await onSend({ ...form, captchaToken });
      } else {
        const endpoint = API_URL ? `${API_URL}/api/contact` : "/api/contact";
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, captchaToken }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.message || "fail");
      }

      const elapsed = Date.now() - start;
      const minDelay = 6000;
      if (elapsed < minDelay) {
        await new Promise((r) => setTimeout(r, minDelay - elapsed));
      }

      setStatus("success");
      setForm({ nom: "", email: "", sujet: "", message: "", consent: false });
      setErrors({});

      setTimeout(() => setStatus("idle"), 2200);
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="contact-form" className={styles.wrapper} aria-labelledby="contact-title">
      <h2 id="contact-title" className={styles.title}>Contacte-nous</h2>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.row}>
          <label className={styles.label}>
            Nom
            <input
              type="text"
              value={form.nom}
              onChange={(e) => update("nom", e.target.value)}
              className={`${styles.input} ${errors.nom ? styles.inputError : ""}`}
              aria-invalid={!!errors.nom}
              aria-describedby={errors.nom ? "err-nom" : undefined}
              required
            />
            {errors.nom && <span id="err-nom" className={styles.error}>{errors.nom}</span>}
          </label>

          <label className={styles.label}>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "err-email" : undefined}
              required
            />
            {errors.email && <span id="err-email" className={styles.error}>{errors.email}</span>}
          </label>
        </div>

        <label className={styles.label}>
          Sujet
          <input
            type="text"
            value={form.sujet}
            onChange={(e) => update("sujet", e.target.value)}
            className={`${styles.input} ${errors.sujet ? styles.inputError : ""}`}
            aria-invalid={!!errors.sujet}
            aria-describedby={errors.sujet ? "err-sujet" : undefined}
            required
          />
          {errors.sujet && <span id="err-sujet" className={styles.error}>{errors.sujet}</span>}
        </label>

        <label className={styles.label}>
          Message
          <textarea
            rows={6}
            value={form.message}
            onChange={(e) => update("message", e.target.value)}
            className={`${styles.textarea} ${errors.message ? styles.inputError : ""}`}
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? "err-message" : undefined}
            required
          />
          {errors.message && <span id="err-message" className={styles.error}>{errors.message}</span>}
        </label>

        <label className={styles.consent}>
          <input
            type="checkbox"
            checked={form.consent}
            onChange={(e) => update("consent", e.target.checked)}
          />
          <span>J'accepte la politique de confidentialité</span>
        </label>
        {errors.consent && <span className={styles.error}>{errors.consent}</span>}

        <div className={styles.actions}>
          <BoutonAction type="submit" disabled={status === "sending" || status === "success"}>
            {status === "sending" ? (
              <span className={styles.loaderWrap}>
                <img src={logoAnimate} alt="" aria-hidden="true" className={styles.loaderIcon} />
                <span>Envoi...</span>
              </span>
            ) : status === "success" ? (
              <span>Message envoyé ✔</span>
            ) : (
              "Envoyer"
            )}
          </BoutonAction>
          {status === "error" && <span className={styles.error}>Une erreur est survenue. Réessaie.</span>}
        </div>
      </form>
    </section>
  );
}
