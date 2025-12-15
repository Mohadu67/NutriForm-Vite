import React, { useEffect, useMemo, useRef, useState } from "react";
import { storage } from '../../../shared/utils/storage';
import { secureApiCall, isAuthenticated } from "../../../utils/authService.js";
import logger from '../../../shared/utils/logger.js';

export default function Salutation({ className = "", seedKey = "static" }) {
  const [displayName, setDisplayName] = useState("");
  const phraseRef = useRef("");

  useEffect(() => {
    try {
      const cached = storage.get("user") || null;
      const cachedName =
        cached?.prenom ||
        cached?.pseudo ||
        cached?.displayName ||
        (cached?.email ? String(cached.email).split("@")[0] : "");
      if (cachedName) setDisplayName(cachedName);
    } catch (e) {
      logger.error("Failed to load cached user name from localStorage:", e);
    }

    // Ne pas appeler l'API si l'utilisateur n'est pas authentifié
    if (!isAuthenticated()) return;

    secureApiCall('/me')
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

  const capitalizedName = useMemo(() => {
    if (!displayName) return "";
    const trimmed = displayName.trim();
    if (!trimmed) return "";
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }, [displayName]);

  const phrasePool = useMemo(() => {
    if (capitalizedName) {
      return [
        `Prêt pour ta séance, ${capitalizedName} ?`,
        `C'est parti ${capitalizedName} !`,
        `En forme ${capitalizedName} ?`,
        `À toi de jouer, ${capitalizedName} !`,
        `Motivé aujourd'hui, ${capitalizedName} ?`
      ];
    }
    return [
      "Prêt pour ta séance ?",
      "C'est parti !",
      "En forme aujourd'hui ?",
      "À toi de jouer !",
      "Motivé pour l'entraînement ?"
    ];
  }, [capitalizedName]);

  useEffect(() => {
    const pool = Array.isArray(phrasePool) ? phrasePool : [];
    const pick = pool.length
      ? pool[Math.floor(Math.random() * pool.length)]
      : (capitalizedName ? `Bienvenue ${capitalizedName}` : "Bienvenue");
    phraseRef.current = pick;
  }, [seedKey, phrasePool, capitalizedName]);

  return (
    <h2 className={className}>
      {phraseRef.current || (capitalizedName ? `Bienvenue ${capitalizedName}` : "Bienvenue")}
    </h2>
  );
}
