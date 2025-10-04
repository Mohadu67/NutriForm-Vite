import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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

  const capitalizedName = useMemo(() => {
    if (!displayName) return "";
    const trimmed = displayName.trim();
    if (!trimmed) return "";
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }, [displayName]);

  const phrasePool = useMemo(() => {
    const key = capitalizedName
      ? "exercise.salutation.named"
      : "exercise.salutation.generic";
    const options = {
      returnObjects: true,
    };
    if (capitalizedName) options.name = capitalizedName;
    const list = t(key, options);
    if (Array.isArray(list) && list.length > 0) return list;
    return [t("exercise.salutation.fallback", { name: capitalizedName })];
  }, [t, capitalizedName]);

  useEffect(() => {
    const pool = Array.isArray(phrasePool) ? phrasePool : [];
    const pick = pool.length
      ? pool[Math.floor(Math.random() * pool.length)]
      : t("exercise.salutation.fallback", { name: capitalizedName });
    phraseRef.current = pick;
  }, [seedKey, phrasePool, t, capitalizedName]);

  return (
    <h2 className={className}>
      {phraseRef.current || t("exercise.salutation.fallback", { name: capitalizedName })}
    </h2>
  );
}
