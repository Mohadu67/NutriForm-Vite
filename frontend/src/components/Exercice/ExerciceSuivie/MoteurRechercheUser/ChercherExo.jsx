import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../../BoutonAction/BoutonAction";
import styles from "./ChercherExo.module.css";
import { idOf } from "../../Shared/idOf";
import { mergeById } from "../../Shared/selectionUtils";
import { loadExercises } from "../../../../utils/exercisesLoader";

export default function ChercherExo({
  preselectedIds = [],
  onConfirm = () => {},
  onCancel,
}) {
  const { t } = useTranslation();
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [muscle, setMuscle] = useState("");
  const [equip, setEquip] = useState("");

  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const preSet = useMemo(() => new Set((preselectedIds || []).map(idOf)), [preselectedIds]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const exercises = await loadExercises('all');
        // Dédupliquer par ID pour éviter les clés en double dans React
        const seen = new Map();
        exercises.forEach(ex => {
          const key = idOf(ex);
          if (!seen.has(key)) {
            seen.set(key, ex);
          }
        });
        const uniqueExercises = Array.from(seen.values());
        if (alive) setAll(uniqueExercises);
      } catch (e) {
        if (alive) setError(e?.message || "Impossible de charger les exercices");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const options = useMemo(() => {
    return {
      type: ["", "muscu", "cardio", "yoga", "natation", "meditation", "endurance", "etirement"],
      muscle: ["", "pectoraux", "dos", "epaules", "bras", "jambes", "core"],
      equip: ["", "poids-du-corps", "halteres", "machine", "barre", "kettlebell", "poulie"],
    };
  }, []);

  const filtered = useMemo(() => {
    const qn = q.trim().toLowerCase();
    return all.filter((ex) => {
      const name = String(ex.name || ex.title || "").toLowerCase();

      const okQ = !qn || name.includes(qn);

      const types = Array.isArray(ex.type) ? ex.type : (ex.type ? String(ex.type).split(/[,;]+/).map(s=>s.trim()) : []);
      const typesC = types.map(t => String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, ""));
      const okT = !type || typesC.some((t) => t.includes(type.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "")));

      const muscles = Array.isArray(ex.muscles) ? ex.muscles : (ex.muscle ? [ex.muscle] : []);
      const musclesC = muscles.map(m => String(m || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, ""));
      const okM = !muscle || musclesC.some((m) => m.includes(muscle.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "")));

      const equips = Array.isArray(ex.equipment) ? ex.equipment : (ex.equip ? [ex.equip] : []);
      const equipsC = equips.map(e => String(e || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, ""));
      const okE = !equip || equipsC.some((e) => e.includes(equip.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "")));

      return okQ && okT && okM && okE;
    });
  }, [all, q, type, muscle, equip]);

  function toggle(id) {
    if (preSet.has(id)) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleConfirm() {
    const selected = new Set(selectedIds);
    const pickedNew = all.filter((ex) => selected.has(idOf(ex)));
    const pickedPre = all.filter((ex) => preSet.has(idOf(ex)));

    const merged = mergeById(pickedPre, pickedNew);

    try {
      const str = JSON.stringify(merged);
      localStorage.setItem("dynamiSelected", str);
      localStorage.setItem("formSelectedExercises", str);
      localStorage.setItem("dynamiHasTouched", "1");
    } catch (e) {
      console.error("Failed to save merged exercises:", e);
    }

    try { onConfirm && onConfirm(merged); } catch (e) {
      console.error("Failed to call onConfirm:", e);
    }

    try {
      window.dispatchEvent(new CustomEvent('dynami:selected:replace', { detail: { items: merged } }));
    } catch (e) {
      console.error("Failed to dispatch event:", e);
    }

    setQ("");
    setSelectedIds(new Set());
  }

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <h3 style={{ margin: 0 }}>{t('exercice.addExercises')}</h3>
        <div className={styles.headerActions}>
          {onCancel && (
            <Button className={styles.btnAnnule} type="button" onClick={onCancel}>{t('exercice.cancel')}</Button>
          )}
        </div>
      </header>

      <div className={styles.filters}>
        <input
          type="search"
          placeholder={t('exercice.searchByName')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const first = filtered.find(ex => !preSet.has(idOf(ex)));
              if (first) {
                e.preventDefault();
                toggle(idOf(first));
              }
            }
          }}
          className={styles.search}
        />
        <div className={styles.selects}>
          <select value={type} onChange={(e) => setType(e.target.value)} className={styles.select}>
            {options.type.map((v, i) => (
              <option key={i} value={v}>
                {v === "" ? t('exercice.allTypes') : v === "etirement" ? "étirement" : v}
              </option>
            ))}
          </select>
          <select value={muscle} onChange={(e) => setMuscle(e.target.value)} className={styles.select}>
            {options.muscle.map((v, i) => (
              <option key={i} value={v}>
                {v === "" ? t('exercice.allMuscles') : v === "epaules" ? "épaules" : v}
              </option>
            ))}
          </select>
          <select value={equip} onChange={(e) => setEquip(e.target.value)} className={styles.select}>
            {options.equip.map((v, i) => (
              <option key={i} value={v}>
                {v === "" ? t('exercice.allEquipment') : v.replace(/-/g, " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <p className={styles.loading}>Chargement… respire, on feuillette la bd.json.</p>}
      {error && <p className={styles.error}>Erreur: {error}</p>}

      {!loading && !error && (
        <ul className={styles.list}>
          {filtered.map((ex) => {
            const id = idOf(ex);
            const isPre = preSet.has(id);
            const checked = selectedIds.has(id);
            const subtitle = [
              ex.type && String(ex.type),
              Array.isArray(ex.muscles) ? ex.muscles.join(", ") : ex.muscle,
              Array.isArray(ex.equipment) ? ex.equipment.join(", ") : ex.equip,
            ].filter(Boolean).join(" • ");
            const imgSrc = ex.image || ex.img || ex.picture || ex.photo || ex.thumbnail || ex.thumb || ex.gif || (Array.isArray(ex.images) ? (ex.images[0]?.url || ex.images[0]) : null) || null;
            return (
              <li key={id} className={styles.item}>
                <label className={styles.itemLabel}>
                  <input type="checkbox" checked={checked} onChange={() => toggle(id)} disabled={isPre} />
                  {imgSrc && (
                    <img
                      src={imgSrc}
                      alt={(ex.name || ex.title || "exercice") + " thumbnail"}
                      loading="lazy"
                      className={styles.thumb}
                    />
                  )}
                  <div>
                    <div className={styles.itemTitleRow}>
                      <span>{ex.name || ex.title}</span>
                      {isPre && (
                        <span className={styles.badge}>
                          {t('exercice.alreadyAdded')}
                        </span>
                      )}
                    </div>
                    {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
                  </div>
                </label>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className={styles.empty}>{t('exercice.noResults')}</li>
          )}
        </ul>
      )}

      <div className={styles.footer}>
        <Button type="button" onClick={handleConfirm} disabled={selectedIds.size === 0}>
          {t('exercice.add')} {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
        </Button>
      </div>
    </section>
  );
}
