

import React, { useState } from "react";
import styles from "./FinSenace.module.css";

export default function FinSeance() {
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>🎉 Bravo !</h2>
        <p className={styles.text}>Tu as terminé ta séance. Repose-toi, hydrate-toi et profite de tes progrès ! 💪</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button className={styles.finishBtn} onClick={() => setDone(true)}>
        Fin de séance
      </button>
    </div>
  );
}