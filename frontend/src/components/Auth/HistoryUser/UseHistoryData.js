import { useEffect, useState } from "react";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

function getToken() {
  return (
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("jwt") ||
    localStorage.getItem("accessToken")
  );
}

export default function useHistoryData() {
  const [records, setRecords] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [points, setPoints] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  // Initialiser avec le nom en cache pour affichage immédiat
  const [displayName, setDisplayName] = useState(localStorage.getItem("cachedDisplayName") || "");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setError("Non connecté. Connecte-toi d'abord.");
      return;
    }

    setStatus("loading");

    // Récupère le user
    fetch(`${API_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
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
        // Mettre en cache le nom pour les prochains chargements
        localStorage.setItem("cachedDisplayName", finalName);
      })
      .catch(() => {});

    fetch(`${API_URL}/api/history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const src = Array.isArray(data)
          ? data
          : Array.isArray(data?.history)
          ? data.history
          : [];
        const list = src
          .map((r) => {
            const m = r?.meta || {};
            const date = r?.createdAt
              ? new Date(r.createdAt)
              : m?.date
              ? new Date(m.date)
              : new Date();
            if (r?.action === "IMC_CALC") {
              const value = Number(m?.imc);
              return Number.isFinite(value)
                ? {
                    id: r?._id,
                    type: "imc",
                    value,
                    date,
                    poids: typeof m?.poids === "number" ? m.poids : undefined,
                    categorie:
                      typeof m?.categorie === "string" ? m.categorie : undefined,
                  }
                : null;
            }
            if (r?.action === "CALORIES_CALC") {
              const value = Number(m?.calories ?? m?.kcal);
              return Number.isFinite(value)
                ? { id: r?._id, type: "calories", value, date }
                : null;
            }
            return null;
          })
          .filter(Boolean)
          .sort((a, b) => a.date - b.date);

        setRecords(list);
        setStatus("idle");
      })
      .catch((e) => {
        setError(e.message || "Erreur de chargement");
        setStatus("error");
      });

    fetch(`${API_URL}/api/workouts/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
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
    const token = getToken();
    if (!token || !id) return;
    if (!window.confirm("Supprimer cette mesure ?")) return;
    try {
      const res = await fetch(`${API_URL}/api/history/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
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