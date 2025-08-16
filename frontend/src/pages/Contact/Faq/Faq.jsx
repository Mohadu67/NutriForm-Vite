import React, { useState } from "react";
import styles from "./Faq.module.css";

const DATA = [
  {
    q: "Je suis dans la catégorie obèse... dois-je écrire mes dernières volontés ?",
    a: "Pas de panique ! Être dans la catégorie obèse ne signifie pas que tu es en danger immédiat. L'important est d'adopter un mode de vie sain avec des objectifs réalistes. On est là pour t'aider à y arriver !",
  },
  {
    q: "Si je mange une pizza entière, est-ce que ça va changer mon IMC ?",
    a: "Heureusement non ! Profite de ta pizza avec modération. L'IMC ne juge pas tes plaisirs occasionnels, mais plutôt ta santé à long terme. Un bon équilibre, c'est la clé !",
  },
  {
    q: "Comment puis-je calculer mon IMC ?",
    a: "Pour calculer ton IMC, il te suffit d'entrer ton poids et ta taille dans le formulaire sur la page dédiée, et notre calculateur te donnera un résultat instantané.",
  },
  {
    q: "Comment puis-je utiliser le calculateur de calories ?",
    a: "Le calculateur de calories te permet de définir tes objectifs en fonction de ton poids actuel et de ton objectif (perte, maintien, prise de poids). Remplis les champs requis, et nous te proposerons un plan adapté à tes besoins.",
  },
  {
    q: "Les données sont-elles sécurisées ?",
    a: "Oui, nous prenons très au sérieux la protection des données. Tu as le contrôle sur les cookies et les informations que tu partages via notre gestionnaire de consentement.",
  },
  {
    q: "Puis-je modifier mon objectif après l'avoir défini ?",
    a: "Bien sûr ! Tu peux recalculer tes besoins à tout moment en modifiant les informations dans les formulaires IMC et Calories.",
  },
];

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (idx) => setOpenIndex((prev) => (prev === idx ? null : idx));

  return (
    <section className={styles.faqSection} aria-labelledby="faq-title">
      <h2>Foire Aux Questions (FAQ)</h2>

      {DATA.map((item, idx) => (
        <div key={idx} className={styles.faqItem}>
          <h3>
            <button
              type="button"
              aria-expanded={openIndex === idx}
              aria-controls={`faq-panel-${idx}`}
              onClick={() => toggle(idx)}
              style={{
                all: "unset",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              }}
            >
              <span>{item.q}</span>
              <span aria-hidden>{openIndex === idx ? "−" : "+"}</span>
            </button>
          </h3>
          <div
            id={`faq-panel-${idx}`}
            role="region"
            hidden={openIndex !== idx}
          >
            <p className={styles.reponse}>{item.a}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
