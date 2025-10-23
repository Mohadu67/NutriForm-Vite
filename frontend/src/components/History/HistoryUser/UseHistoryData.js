import { useEffect, useState } from "react";
import { secureApiCall } from "../../../utils/authService";

export default function useHistoryData() {
  const [records, setRecords] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [points, setPoints] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  
  const [displayName, setDisplayName] = useState(localStorage.getItem("cachedDisplayName") || "");
  const [user, setUser] = useState(null);

  useEffect(() => {
    setStatus("loading");

    secureApiCall('/api/me')
      .then((res) => res.json())
      .then((data) => {
        const name =
          data?.prenom ||
          data?.pseudo ||
          data?.displayName ||
          (data?.email ? data.email.split("@")[0] : "");
        const finalName = name || "Utilisateur";
        setDisplayName(finalName);
        setUser(data);
        localStorage.setItem("cachedDisplayName", finalName);

        const userStr = localStorage.getItem("user");
        if (userStr) {
          try {
            const userData = JSON.parse(userStr);
            const updatedUser = { ...userData, ...data };
            localStorage.setItem("user", JSON.stringify(updatedUser));
          } catch (e) {
            localStorage.setItem("user", JSON.stringify(data));
          }
        } else {
          localStorage.setItem("user", JSON.stringify(data));
        }
      })
      .catch((err) => {
        console.error('[UseHistoryData] Auth error:', err);

        const errorMsg = err?.message || '';
        if (errorMsg === 'Not authenticated') {
          setError("Non connecté. Connecte-toi pour voir tes données.");
          setStatus("error");
          return;
        }

        const weeklyGoal = localStorage.getItem('weeklyGoal');
        const dynamiPrefs = {
          dynamiStep: localStorage.getItem('dynamiStep'),
          dynamiType: localStorage.getItem('dynamiType'),
          dynamiEquip: localStorage.getItem('dynamiEquip'),
          dynamiMuscle: localStorage.getItem('dynamiMuscle'),
        };

        localStorage.clear();
        sessionStorage.clear();

        if (weeklyGoal) localStorage.setItem('weeklyGoal', weeklyGoal);
        Object.entries(dynamiPrefs).forEach(([key, value]) => {
          if (value) localStorage.setItem(key, value);
        });

        setError("Session expirée. Reconnecte-toi.");
        setStatus("error");
      });

    secureApiCall('/api/history')
      .then((res) => res.json())
      .then((data) => {
        const src = Array.isArray(data)
          ? data
          : Array.isArray(data?.history)
          ? data.history
          : [];

        const parseDateSafe = (value) => {
          if (!value) return null;
          if (value instanceof Date) {
            return Number.isNaN(value.getTime()) ? null : value;
          }
          const d = new Date(value);
          return Number.isNaN(d.getTime()) ? null : d;
        };

        const toFiniteNumber = (value) => {
          const n = Number(value);
          return Number.isFinite(n) ? n : null;
        };

        const list = [];

        src.forEach((r) => {
          const m = r?.meta || {};
          const createdAt = parseDateSafe(r?.createdAt);
          const metaDate = parseDateSafe(m?.date);
          const date = createdAt || metaDate || new Date();

          if (r?.action === "IMC_CALC" || m?.type === "imc") {
            const value = toFiniteNumber(m?.imc);
            if (value != null) {
              list.push({
                id: r?._id,
                type: "imc",
                value,
                date,
                poids: toFiniteNumber(m?.poids) ?? undefined,
                categorie:
                  typeof m?.categorie === "string" ? m.categorie : undefined,
              });
            }
            return;
          }

          if (r?.action === "CALORIES_CALC" || m?.type === "calories") {
            const value = toFiniteNumber(
              m?.calories ?? m?.kcal ?? m?.caloriesDaily ?? m?.dailyCalories
            );
            if (value != null) {
              list.push({ id: r?._id, type: "calories", value, date });
            }
            return;
          }

          if (m?.type === "rm") {
            const rm = toFiniteNumber(m?.rm);
            const poids = toFiniteNumber(m?.poids ?? m?.weight ?? m?.weightKg);
            const reps = toFiniteNumber(m?.reps);

            if (rm != null) {
              list.push({
                id: r?._id,
                type: "rm",
                date,
                exercice: m?.exercice || m?.exercise || m?.label || "Exercice",
                poids: poids ?? undefined,
                reps: reps ?? undefined,
                rm,
                formulas:
                  m?.formulas && typeof m.formulas === "object"
                    ? m.formulas
                    : {},
              });
            }
          }
        });

        list.sort((a, b) => a.date - b.date);

        setRecords(list);
        setStatus("idle");
      })
      .catch((e) => {
        setError(e.message || "Erreur de chargement");
        setStatus("error");
      });

    secureApiCall('/api/workouts/sessions')
      .then((res) => res.json())
      .then((data) => {
        const src = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
          ? data.items
          : [];

        if (Array.isArray(data?.points)) {
          setPoints(data.points);
        }

        const normalizeEntries = (s) => {
          const raw = Array.isArray(s?.entries) ? s.entries
            : Array.isArray(s?.items) ? s.items
            : Array.isArray(s?.exercises) ? s.exercises
            : [];
          const entries = raw.map((e) => {
            if (e && typeof e === "object") {
              const name = e.name || e.label || e.exerciseName || e.exoName || e.title || "Exercice";
              return { name, ...e };
            }
            return { name: String(e ?? "Exercice") };
          });
          return { entries, items: entries, exercises: entries };
        };

        const list = src
          .map((s) => ({
            ...s,
            id: s?._id || s?.id,
            name: s?.name || "Séance",
            startedAt: s?.startedAt ? new Date(s.startedAt) : null,
            endedAt: s?.endedAt ? new Date(s.endedAt) : null,
            ...normalizeEntries(s),
          }))
          .sort(
            (a, b) =>
              (b.startedAt?.getTime?.() || 0) -
              (a.startedAt?.getTime?.() || 0)
          );
        setSessions(list);
      })
      .catch((e) => {
        setError(e?.message || "Erreur de chargement des sessions");
      });
  }, []);

  const handleDelete = async (id) => {
    if (!id) return;
    if (!window.confirm("Supprimer cette mesure ?")) return;
    try {
      const res = await secureApiCall(`/api/history/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRecords((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (e) {
      console.error("Erreur lors de la suppression", e);
    }
  };

  return { records, sessions, points, status, error, displayName, user, setRecords, handleDelete };
}
