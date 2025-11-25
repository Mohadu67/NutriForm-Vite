import { useState } from "react";
import { Helmet } from "@dr.pogodin/react-helmet";
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
  {
    q: "Est-ce que courir après le bus compte comme du cardio ?",
    a: "Techniquement oui ! Mais on te conseille quand même de prévoir une vraie séance de cardio. Les horaires de bus sont trop imprévisibles pour en faire une routine d'entraînement fiable. 🚌💨",
  },
  {
    q: "J'ai mangé un cookie avant de m'entraîner, mon workout est annulé ?",
    a: "Au contraire ! Ce cookie te donne l'énergie nécessaire pour briller pendant ton entraînement. Les glucides avant l'effort, c'est du carburant de champion. Maintenant, va transpirer !",
  },
  {
    q: "Combien de temps avant de ressembler à Dwayne 'The Rock' Johnson ?",
    a: "Avec beaucoup de travail, une génétique favorable, et environ 20 ans d'entraînement intensif... tu auras fait un excellent parcours ! The Rock n'a pas été construit en un jour. Concentre-toi sur tes propres objectifs, ils sont tout aussi valables. 💪",
  },
  {
    q: "Est-ce que faire du yoga en regardant Netflix compte ?",
    a: "Si tu arrives à tenir une posture pendant tout un épisode, chapeau ! Mais pour de vrais résultats, on te conseille de mettre la série sur pause et de te concentrer sur ta pratique. Namaste et... pause !",
  },
  {
    q: "Pourquoi mon ventre fait encore du bruit après avoir mangé ?",
    a: "Ton système digestif travaille dur ! C'est normal d'entendre quelques gargouillements. Si ça devient gênant pendant tes cours de yoga, mange des aliments plus légers avant ta séance.",
  },
  {
    q: "Je peux remplacer l'eau par du café pendant mes workouts ?",
    a: "Le café, c'est génial pour te booster avant l'entraînement, mais l'eau reste irremplaçable pendant l'effort. Hydrate-toi avec de l'eau, et garde ton café pour le plaisir ! ☕",
  },
  {
    q: "Est-ce que les burpees ont été inventés comme punition ?",
    a: "On se pose la question aussi ! Mais malgré leur réputation, les burpees sont ultra-efficaces pour le cardio et le renforcement musculaire. Courage, chaque burpee te rapproche de tes objectifs !",
  },
  {
    q: "Combien de calories dans mes larmes après une séance de HIIT ?",
    a: "Environ 0, mais la satisfaction d'avoir terminé cette séance vaut toutes les calories du monde ! Les séances difficiles forgent le caractère. Tu vas y arriver ! 💪😅",
  },
  {
    q: "Mon chat fait-il plus de yoga que moi ?",
    a: "Probablement ! Les chats sont les maîtres zen de l'étirement et de la relaxation. Inspire-toi de lui pour tes étirements matinaux, mais n'oublie pas d'ajouter un peu plus d'intensité à ta pratique !",
  },
  {
    q: "Pourquoi suis-je plus motivé à 23h qu'à 7h du matin ?",
    a: "Le syndrome du 'demain je commence' frappe encore ! La motivation nocturne est réelle, mais les résultats viennent avec l'action. Mets ton réveil, prépare tes affaires, et lance-toi dès le matin. Le toi du futur te remerciera !",
  },
  {
    q: "Est-ce que penser à faire du sport brûle des calories ?",
    a: "Malheureusement non, mais c'est déjà un premier pas vers l'action ! Transformer ces pensées en mouvement, voilà où la magie opère. Enfile tes baskets et passe à l'action ! 🏃‍♂️",
  },
  {
    q: "Combien de fois par semaine dois-je m'entraîner ?",
    a: "L'idéal est de viser 3-5 séances par semaine, en alternant cardio, musculation et récupération. L'important est la régularité, pas l'intensité extrême dès le départ !",
  },
  {
    q: "Est-ce que je peux cibler la perte de graisse sur une zone précise ?",
    a: "Spoiler : non, la perte de graisse localisée est un mythe. Ton corps décide où il perd du gras. Concentre-toi sur une alimentation équilibrée et un entraînement complet !",
  },
  {
    q: "C'est mieux de s'entraîner le matin ou le soir ?",
    a: "Le meilleur moment, c'est celui où tu peux être régulier ! Certains préfèrent le boost matinal, d'autres décompressent le soir. Teste et trouve ton créneau idéal.",
  },
  {
    q: "Dois-je prendre des compléments alimentaires ?",
    a: "Une alimentation équilibrée couvre la plupart des besoins. Les compléments peuvent aider dans certains cas (protéines, vitamine D), mais demande toujours conseil à un professionnel de santé avant !",
  },
  {
    q: "Est-ce que les courbatures veulent dire que j'ai bien travaillé ?",
    a: "Pas forcément ! Les courbatures indiquent que tes muscles ne sont pas habitués à l'effort, mais leur absence ne signifie pas que ton entraînement était inefficace. Écoute ton corps !",
  },
  {
    q: "Combien de protéines dois-je manger par jour ?",
    a: "En général, vise 1,6 à 2,2g de protéines par kg de poids corporel si tu fais de la musculation. Notre calculateur de calories peut t'aider à affiner ces chiffres selon tes objectifs !",
  },
  {
    q: "Pourquoi je ne vois pas de résultats après 2 semaines ?",
    a: "La transformation physique prend du temps ! Les premiers changements visibles apparaissent généralement après 4-6 semaines. Patience et constance sont tes meilleurs alliés. Continue !",
  },
  {
    q: "Est-ce que je peux transformer mon gras en muscle ?",
    a: "Non, le gras et le muscle sont deux tissus différents. Tu peux perdre du gras ET gagner du muscle simultanément avec le bon programme, mais il n'y a pas de transformation directe !",
  },
  {
    q: "Je n'ai que 20 minutes, ça vaut le coup de m'entraîner ?",
    a: "Absolument ! Un bon HIIT de 20 minutes peut être incroyablement efficace. La qualité prime sur la quantité. Chaque session compte !",
  },
  {
    q: "C'est normal d'avoir super faim après l'entraînement ?",
    a: "Totalement normal ! Ton corps a brûlé de l'énergie et demande à être ravitaillé. Mange un repas équilibré dans les 2h après ton workout. Protéines + glucides = combo gagnant !",
  },
  {
    q: "Que faire si je stagne dans mes performances ?",
    a: "Change de routine ! Varie les exercices, augmente l'intensité, modifie tes temps de repos. Ton corps s'adapte rapidement, surprends-le avec de nouveaux défis !",
  },
  {
    q: "Les abdos se font dans la cuisine, c'est vrai ?",
    a: "À 70% vrai ! Tu peux faire tous les crunchs du monde, mais si ton alimentation ne suit pas, tes abdos resteront cachés. Nutrition + entraînement = résultats visibles !",
  },
  {
    q: "Est-ce que je peux prendre du muscle en étant végétarien/vegan ?",
    a: "Absolument ! De nombreux athlètes végé/vegan le prouvent. Assure-toi d'avoir assez de protéines végétales (légumineuses, tofu, tempeh, protéines en poudre végétales).",
  },
  {
    q: "Combien d'eau dois-je boire pendant le sport ?",
    a: "En règle générale, bois 400-800ml par heure d'exercice, par petites gorgées régulières. Si tu transpires beaucoup, augmente ces quantités. La couleur de ton urine est un bon indicateur !",
  },
  {
    q: "C'est grave si je saute un jour d'entraînement ?",
    a: "Pas du tout ! Le repos fait partie de l'entraînement. Un jour de skip n'annule pas tes progrès. Par contre, si un jour devient une semaine, là il faut se remotiver !",
  },
];

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (idx) => setOpenIndex((prev) => (prev === idx ? null : idx));

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": DATA.map((item) => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a
      }
    }))
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>
      <section className={styles.faqSection} aria-labelledby="faq-title">
        <h2>Foire Aux Questions</h2>

        {DATA.map((item) => (
          <div
            key={item.q}
            className={styles.faqItem}
            role="button"
            tabIndex={0}
            aria-expanded={openIndex === item.q}
            aria-controls={`faq-panel-${item.q}`}
            onClick={() => toggle(item.q)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggle(item.q);
              }
            }}
          >
            <h3>
              <span>{item.q}</span>
            </h3>
            <div
              id={`faq-panel-${item.q}`}
              role="region"
              hidden={openIndex !== item.q}
            >
              <p className={styles.reponse}>{item.a}</p>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
