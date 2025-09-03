import { useEffect, useMemo, useState } from "react";
import Button from "../../BoutonAction/BoutonAction";
import styles from "./ChercherExo.module.css";

export default function ChercherExo({
  sourceUrl = "/data/db.json",
  preselectedIds = [],
  onConfirm = () => {},
  onBack,
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

  const canon = (s) =>
    String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");

  const preSet = useMemo(() => new Set(preselectedIds || []), [preselectedIds]);

  // Charger le JSON
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(sourceUrl, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // Supporte soit un tableau direct, soit { exercises: [...] }
        const list = Array.isArray(data) ? data : (data.exercises || data.items || []);
        if (alive) setAll(Array.isArray(list) ? list : []);
      } catch (e) {
        if (alive) setError(e?.message || "Impossible de charger bd.json");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [sourceUrl]);

  // Dédoublonnage et options de filtres
  const options = useMemo(() => {
    return {
      type: ["", "muscu", "cardio", "yoga", "meditation", "endurance", "etirement"],
      muscle: ["", "pectoraux", "dos", "epaules", "bras", "jambes", "core"],
      equip: ["", "poids-du-corps", "halteres", "machine", "barre", "kettlebell", "poulie"],
    };
  }, []);

  // Filtrage
  const filtered = useMemo(() => {
    const qn = q.trim().toLowerCase();
    return all.filter((ex) => {
      const name = String(ex.name || ex.title || "").toLowerCase();

      const okQ = !qn || name.includes(qn);

      const types = Array.isArray(ex.type) ? ex.type : (ex.type ? String(ex.type).split(/[,;]+/).map(s=>s.trim()) : []);
      const typesC = types.map(canon);
      const okT = !type || typesC.some((t) => t.includes(canon(type)));

      const muscles = Array.isArray(ex.muscles) ? ex.muscles : (ex.muscle ? [ex.muscle] : []);
      const musclesC = muscles.map(canon);
      const okM = !muscle || musclesC.some((m) => m.includes(canon(muscle)));

      const equips = Array.isArray(ex.equipment) ? ex.equipment : (ex.equip ? [ex.equip] : []);
      const equipsC = equips.map(canon);
      const okE = !equip || equipsC.some((e) => e.includes(canon(equip)));

      return okQ && okT && okM && okE;
    });
  }, [all, q, type, muscle, equip]);

  function toggle(id) {
    if (preSet.has(id)) return; // déjà dans la séance, on ne touche pas
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleConfirm() {
    const picked = all.filter((ex) => selectedIds.has(ex.id ?? ex._id ?? ex.slug ?? canon(ex.name || ex.title)));
    onConfirm(picked);
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
          placeholder="Rechercher par nom…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={styles.search}
        />
        <div className={styles.selects}>
          <select value={type} onChange={(e) => setType(e.target.value)} className={styles.select}>
            {options.type.map((v, i) => (
              <option key={i} value={v}>
                {v === "" ? "Tous types" : v === "etirement" ? "étirement" : v}
              </option>
            ))}
          </select>
          <select value={muscle} onChange={(e) => setMuscle(e.target.value)} className={styles.select}>
            {options.muscle.map((v, i) => (
              <option key={i} value={v}>
                {v === "" ? "Tous muscles" : v === "epaules" ? "épaules" : v}
              </option>
            ))}
          </select>
          <select value={equip} onChange={(e) => setEquip(e.target.value)} className={styles.select}>
            {options.equip.map((v, i) => (
              <option key={i} value={v}>
                {v === "" ? "Tout équipement" : v.replace(/-/g, " ")}
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
            const id = ex.id ?? ex._id ?? ex.slug ?? canon(ex.name || ex.title);
            const isPre = preSet.has(id);
            const checked = selectedIds.has(id);
            const subtitle = [
              ex.type && String(ex.type),
              Array.isArray(ex.muscles) ? ex.muscles.join(", ") : ex.muscle,
              Array.isArray(ex.equipment) ? ex.equipment.join(", ") : ex.equip,
            ].filter(Boolean).join(" • ");
            return (
              <li key={id} className={styles.item}>
                <label className={styles.itemLabel}>
                  <input type="checkbox" checked={checked} onChange={() => toggle(id)} disabled={isPre} />
                  <div>
                    <div className={styles.itemTitleRow}>
                      <span>{ex.name || ex.title}</span>
                      {isPre && (
                        <span className={styles.badge}>
                          déjà ajouté
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
            <li className={styles.empty}>Aucun résultat. Essaie un autre mot-clé ou retire des filtres.</li>
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
