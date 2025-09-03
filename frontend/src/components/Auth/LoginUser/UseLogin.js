import { useState } from "react";

export default function useLogin(onLoginSuccess, options = {}) {
  const { minDurationMs = 2500 } = options;
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async ({ identifier, password, remember }) => {
    setStatus("loading");
    setErrorMsg("");
    const start = (typeof performance !== "undefined" ? performance.now() : Date.now());
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    try {
      if (!identifier || !password) {
        throw new Error("Identifiant et mot de passe sont requis.");
      }

      const apiBase = import.meta.env.VITE_API_URL;
      if (!apiBase) {
        throw new Error("VITE_API_URL n'est pas défini côté frontend.");
      }

      const endpoint = `${apiBase}/api/login`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier, password, remember }),
      });

      let data = null;
      let raw = "";
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        try {
          data = await res.json();
        } catch (_) {
          data = null;
        }
      } else {
        try {
          raw = await res.text();
        } catch (_) {
          raw = "";
        }
      }

      if (!res.ok) {
        const message =
          (data && (data.message || data.error || data.msg)) ||
          raw ||
          `Échec de connexion (HTTP ${res.status})`;
        throw new Error(message);
      }

      const { token, user } = data || {};

      try {
        const storage = remember ? localStorage : sessionStorage;
        const other = remember ? sessionStorage : localStorage;
        if (token) storage.setItem("token", token);
        if (user) storage.setItem("user", JSON.stringify(user));
        try { other.removeItem("token"); } catch (_) {}
        try { other.removeItem("user"); } catch (_) {}
      } catch (_) {}

      const end = (typeof performance !== "undefined" ? performance.now() : Date.now());
      const elapsed = end - start;
      if (elapsed < minDurationMs) {
        await sleep(minDurationMs - elapsed);
      }
      setStatus("success");
      if (onLoginSuccess && user) onLoginSuccess(user);
      return { token, user };
    } catch (e) {
      {
        const end = (typeof performance !== "undefined" ? performance.now() : Date.now());
        const elapsed = end - start;
        if (elapsed < minDurationMs) {
          await sleep(minDurationMs - elapsed);
        }
      }
      setStatus("error");
      const message = e instanceof Error ? e.message : "Erreur lors de la connexion";
      setErrorMsg(message);
      return null;
    }
  };

  return { status, errorMsg, handleSubmit };
}