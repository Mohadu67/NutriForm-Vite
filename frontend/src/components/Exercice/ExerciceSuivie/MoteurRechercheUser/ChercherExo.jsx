import { useEffect, useMemo, useState } from "react";
import { storage } from '../../../../shared/utils/storage';
import Button from "../../../BoutonAction/BoutonAction";
import styles from "./ChercherExo.module.css";
import { idOf } from "../../Shared/idOf";
import { mergeById } from "../../Shared/selectionUtils";
import { loadExercises } from "../../../../utils/exercisesLoader";
import logger from '../../../../shared/utils/logger.js';

export default function ChercherExo({
  preselectedIds = [],
  preselectedExercises = [], // Exercices complets présélectionnés (pas juste les IDs)
  onConfirm = () => {},
  onCancel,
}) {
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
      muscle: [
        "",
        // Haut du corps
        "pectoraux", "dos", "dos-lats", "dos-superieur", "epaules",
        // Bras
        "biceps", "triceps", "avant-bras",
        // Tronc
        "abdos", "obliques", "core",
        // Bas du corps
        "quadriceps", "ischio", "fessiers", "mollets",
        // Groupes généraux
        "jambes"
      ],
      equip: ["", "poids-du-corps", "halteres", "machine", "barre", "kettlebell", "poulie"],
    };
  }, []);

  // Normaliser une chaîne pour comparaison
  const normalize = (str) => String(str || "").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "");

  // Mapping des groupes musculaires vers muscles spécifiques
  const MUSCLE_GROUPS = {
    dos: ["dos", "dos-lats", "dos-superieur", "dos-inferieur", "lats", "trapeze"],
    jambes: ["quadriceps", "ischio", "ischios", "fessiers", "mollets", "cuisses"],
    bras: ["biceps", "triceps", "avant-bras"],
  };

  const filtered = useMemo(() => {
    const qn = q.trim().toLowerCase();
    const muscleNorm = normalize(muscle);

    return all.filter((ex) => {
      const name = String(ex.name || ex.title || "").toLowerCase();

      // Filtre par recherche texte
      const okQ = !qn || name.includes(qn);

      // Filtre par type
      const types = Array.isArray(ex.type) ? ex.type : (ex.type ? String(ex.type).split(/[,;]+/).map(s=>s.trim()) : []);
      const typesC = types.map(normalize);
      const typeNorm = normalize(type);
      const okT = !type || typesC.some((t) => t.includes(typeNorm));

      // Filtre par muscle - priorité au muscle principal, matching exact
      let okM = true;
      if (muscle) {
        // Récupérer le muscle principal (primaryMuscle ou premier de muscles[])
        const primaryMuscle = normalize(ex.primaryMuscle || (Array.isArray(ex.muscles) ? ex.muscles[0] : ex.muscle) || "");

        // Vérifier si c'est un groupe musculaire
        const expandedMuscles = MUSCLE_GROUPS[muscleNorm] || [muscleNorm];

        // Match exact sur le muscle principal uniquement
        okM = expandedMuscles.some(m => primaryMuscle === normalize(m) || primaryMuscle.includes(normalize(m)));
      }

      // Filtre par équipement
      const equips = Array.isArray(ex.equipment) ? ex.equipment : (ex.equip ? [ex.equip] : []);
      const equipsC = equips.map(normalize);
      const equipNorm = normalize(equip);
      const okE = !equip || equipsC.some((e) => e.includes(equipNorm));

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

    // Utiliser directement les exercices présélectionnés (pas besoin de les chercher dans all)
    const pickedPre = Array.isArray(preselectedExercises) && preselectedExercises.length > 0
      ? preselectedExercises
      : all.filter((ex) => preSet.has(idOf(ex)));

    const merged = mergeById(pickedPre, pickedNew);

    try {
      const str = JSON.stringify(merged);
      storage.set("dynamiSelected", str);
      storage.set("formSelectedExercises", str);
      storage.set("dynamiHasTouched", "1");
    } catch (e) {
      logger.error("Failed to save merged exercises:", e);
    }

    try { onConfirm && onConfirm(merged); } catch (e) {
      logger.error("Failed to call onConfirm:", e);
    }

    try {
      window.dispatchEvent(new CustomEvent('dynami:selected:replace', { detail: { items: merged } }));
    } catch (e) {
      logger.error("Failed to dispatch event:", e);
    }

    setQ("");
    setSelectedIds(new Set());
  }

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <h3 style={{ margin: 0 }}>Ajouter des exercices</h3>
        <div className={styles.headerActions}>
          {onCancel && (
            <Button className={styles.btnAnnule} type="button" onClick={onCancel}>Annuler</Button>
          )}
        </div>
      </header>

      <div className={styles.filters}>
        <input
          type="search"
          placeholder="Rechercher par nom..."
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
                {v === "" ? "Tous les types" : v === "etirement" ? "étirement" : v}
              </option>
            ))}
          </select>
          <select value={muscle} onChange={(e) => setMuscle(e.target.value)} className={styles.select}>
            {options.muscle.map((v, i) => {
              const labels = {
                "": "Tous les muscles",
                pectoraux: "Pectoraux",
                dos: "Dos (tout)",
                "dos-lats": "Dos - Lats",
                "dos-superieur": "Dos - Trapèzes",
                epaules: "Épaules",
                biceps: "Biceps",
                triceps: "Triceps",
                "avant-bras": "Avant-bras",
                abdos: "Abdos",
                obliques: "Obliques",
                core: "Core / Gainage",
                quadriceps: "Quadriceps",
                ischio: "Ischio-jambiers",
                fessiers: "Fessiers",
                mollets: "Mollets",
                jambes: "Jambes (tout)"
              };
              return (
                <option key={i} value={v}>{labels[v] || v}</option>
              );
            })}
          </select>
          <select value={equip} onChange={(e) => setEquip(e.target.value)} className={styles.select}>
            {options.equip.map((v, i) => (
              <option key={i} value={v}>
                {v === "" ? "Tout l'équipement" : v.replace(/-/g, " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <p className={styles.loading}>Chargement des exercices...</p>}
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
                          Déjà ajouté
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
            <li className={styles.empty}>Aucun résultat</li>
          )}
        </ul>
      )}

      <div className={styles.footer}>
        <Button type="button" onClick={handleConfirm} disabled={selectedIds.size === 0}>
          Ajouter {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
        </Button>
      </div>
    </section>
  );
}
