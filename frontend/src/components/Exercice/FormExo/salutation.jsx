import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext.jsx";

export default function Salutation({ className = "", seedKey = "static" }) {
  const { user: authUser } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const phraseRef = useRef("");

  useEffect(() => {
    if (!authUser) return;
    const name =
      authUser.prenom ||
      authUser.pseudo ||
      authUser.displayName ||
      (authUser.email ? String(authUser.email).split("@")[0] : "");
    if (name) setDisplayName(name);
  }, [authUser]);

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
