import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./FinSeance.module.css";
import useSaveSession from "../ExerciceCard/hooks/useSaveSession";

export default function FinSeance({ items = [], onFinish }) {
  const { t } = useTranslation();
  const { saving, error, save } = useSaveSession();
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState({ total: 0, current: 0 });
  const [errors, setErrors] = useState([]);

  const hasItems = Array.isArray(items) && items.length > 0;

  const buttonLabel = useMemo(() => {
    if (saving && progress.total > 0) {
      return t("exercise.finish.saving", {
        current: progress.current,
        total: progress.total,
      });
    }
    if (done) return t("exercise.finish.saved");
    return hasItems
      ? t("exercise.finish.actions.endSession")
      : t("exercise.finish.actions.finish");
  }, [saving, progress, done, hasItems, t]);

  async function handleFinish() {
    setErrors([]);
    if (!hasItems) {
      setDone(true);
      if (onFinish) onFinish({ ok: true, okCount: 0, failCount: 0, errors: [] });
      return;
    }

    const total = items.length;
    setProgress({ total, current: 0 });

    let okCount = 0;
    let failCount = 0;
    const errs = [];

    for (let i = 0; i < total; i++) {
      const it = items[i];
      const res = await save({ exo: it.exo, data: it.data, mode: it.mode });
      if (res?.ok) okCount++;
      else {
        failCount++;
        if (error) errs.push(error);
      }
      setProgress({ total, current: i + 1 });
    }

    setDone(true);
    setErrors(errs);
    if (onFinish) onFinish({ ok: failCount === 0, okCount, failCount, errors: errs });
  }

  if (done) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>{t("exercise.finish.congratsTitle")}</h2>
        <p className={styles.text}>
          {errors.length === 0
            ? t("exercise.finish.successMessage")
            : t("exercise.finish.errorMessage", { count: errors.length })}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button
        className={styles.finishBtn}
        onClick={handleFinish}
        disabled={saving}
        aria-busy={saving ? "true" : "false"}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
