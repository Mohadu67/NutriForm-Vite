

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
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [displayName, setDisplayName] = useState("");

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
        if (name) setDisplayName(name);
      })
      .catch(() => {});

    // Récupère l’historique
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

    // Récupère les sessions
    fetch(`${API_URL}/api/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const src = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
          ? data.items
          : [];
        const list = src
          .map((s) => ({
            id: s?._id,
            name: s?.name || "Séance",
            startedAt: s?.startedAt ? new Date(s.startedAt) : null,
            endedAt: s?.endedAt ? new Date(s.endedAt) : null,
            entriesCount: Array.isArray(s?.entries) ? s.entries.length : 0,
          }))
          .sort(
            (a, b) =>
              (b.startedAt?.getTime?.() || 0) -
              (a.startedAt?.getTime?.() || 0)
          );
        setSessions(list);
      })
      .catch(() => {});
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

  return { records, sessions, status, error, displayName, setRecords, handleDelete };
}