import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaShare } from "react-icons/fa";
import styles from "./FinSeance.module.css";
import useSaveSession from "../ExerciceCard/hooks/useSaveSession";
import ShareModal from "../../../Share/ShareModal";

export default function FinSeance({ items = [], onFinish, sessionData }) {
  const { t } = useTranslation();
  const { saving, save } = useSaveSession();
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState({ total: 0, current: 0 });
  const [errors, setErrors] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [savedSession, setSavedSession] = useState(null);

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
      if (sessionData) setSavedSession(sessionData);
      if (onFinish) onFinish({ ok: true, okCount: 0, failCount: 0, errors: [] });
      return;
    }

    const total = items.length;
    setProgress({ total, current: total });

    // Créer UNE seule séance avec TOUS les exercices
    const res = await save({
      items: items,
      snapshot: sessionData || {}
    });

    const okCount = res?.ok ? 1 : 0;
    const failCount = res?.ok ? 0 : 1;
    const errs = res?.error ? [res.error] : [];

    setDone(true);
    setErrors(errs);
    if (res?.data || sessionData) {
      setSavedSession(res?.data || sessionData);
    }
    if (onFinish) onFinish({ ok: failCount === 0, okCount, failCount, errors: errs });
  }

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (done) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>{t("exercise.finish.congratsTitle")}</h2>
        <p className={styles.text}>
          {errors.length === 0
            ? t("exercise.finish.successMessage")
            : t("exercise.finish.errorMessage", { count: errors.length })}
        </p>

        {savedSession && errors.length === 0 && (
          <button
            className={styles.shareBtn}
            onClick={() => setShowShareModal(true)}
          >
            <FaShare className={styles.shareIcon} />
            Partager ma séance
          </button>
        )}

        {savedSession && (
          <ShareModal
            show={showShareModal}
            onHide={() => setShowShareModal(false)}
            session={savedSession}
            user={user}
          />
        )}
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
