

import React, { useEffect, useRef, useState } from "react";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

function getToken() {
  return (
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("jwt") ||
    localStorage.getItem("accessToken")
  );
}

export default function Salutation({ className = "", seedKey = "static" }) {
  const [displayName, setDisplayName] = useState("");
  const phraseRef = useRef("");

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

  const displayNameSpan = displayName ? (
    <span style={{ textTransform: "capitalize" }}>{displayName}</span>
  ) : null;
  const phrases = [
    displayName
      ? (
        <>Salut {displayNameSpan} 👋, prêt pour une séance ?</>
      )
      : "Salut 👋, prêt pour une séance ?",
    displayName
      ? (
        <>Allez {displayNameSpan} 💪, montre à ces haltères qui est le patron !</>
      )
      : "Allez 💪, montre à ces haltères qui est le patron !",
    displayName
      ? (
        <>{displayNameSpan}, aujourd&apos;hui c&apos;est toi le champion 🏆</>
      )
      : "Aujourd'hui c'est toi le champion 🏆",
    displayName
      ? (
        <>Aujourd&apos;hui c&apos;est toi {displayNameSpan} 🚀</>
      )
      : "On compte sur toi 🚀"
  ];

  useEffect(() => {
    const pool = Array.isArray(phrases) ? phrases : [];
    const pick = pool.length ? pool[Math.floor(Math.random() * pool.length)] : "Bienvenue 👋";
    phraseRef.current = pick;
  }, [seedKey, displayName]);

  return (
    <h2 className={className}>
      {phraseRef.current || "Bienvenue 👋"}
    </h2>
  );
}