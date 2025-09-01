

import React, { useEffect, useState } from "react";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

function getToken() {
  return (
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("jwt") ||
    localStorage.getItem("accessToken")
  );
}

export default function Salutation({ className = "" }) {
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {

    try {
      const cached = JSON.parse(localStorage.getItem("user") || "null");
      const cachedName =
        cached?.prenom ||
        cached?.pseudo ||
        cached?.displayName ||
        (cached?.email ? String(cached.email).split("@")[0] : "");
      if (cachedName) setDisplayName(cachedName);
    } catch (_) {}

    const token = getToken();
    if (!token) return;

    fetch(`${API_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) =>
        res
          .json()
          .then((data) => ({ ok: res.ok, data }))
          .catch(() => ({ ok: res.ok, data: {} }))
      )
      .then(({ ok, data }) => {
        if (!ok) return;
        const name =
          data?.prenom ||
          data?.pseudo ||
          data?.displayName ||
          (data?.email ? String(data.email).split("@")[0] : "");
        if (name) setDisplayName(name);
      })
      .catch(() => {});
  }, []);

  const phrases = [
    displayName ? `Salut ${displayName} 👋, prêt pour une séance ?` : "Salut 👋, prêt pour une séance ?",
    displayName ? `Allez ${displayName} 💪, montre à ces haltères qui est le patron !` : "Allez 💪, montre à ces haltères qui est le patron !",
    displayName ? `${displayName}, aujourd'hui c'est toi le champion 🏆` : "Aujourd'hui c'est toi le champion 🏆",
    displayName ? `On compte sur toi ${displayName} 🚀` : "On compte sur toi 🚀"
  ];
  const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];

  return (
    <h2 className={className}>{randomPhrase}</h2>
  );
}