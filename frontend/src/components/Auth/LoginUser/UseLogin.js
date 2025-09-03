import { useState } from "react";

export default function useLogin(onLoginSuccess) {
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async ({ identifier, password, remember }) => {
    setStatus("loading");
    setErrorMsg("");

    try {
      // Utilise directement la variable VITE_API_URL définie dans l'environnement
      const endpoint = `${import.meta.env.VITE_API_URL}/login`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier, password, remember }),
      });

      let data = null;
      let raw = "";
      try {
        raw = await res.text();
        data = raw ? JSON.parse(raw) : null;
      } catch (_) {
        data = null;
      }

      if (!res.ok) {
        throw new Error(
          (data && (data.message || data.error || data.msg)) ||
          (raw || "Échec de connexion")
        );
      }

      const { token, user } = data || {};

      // Fallback: on garde aussi le token côté front si fourni
      try {
        const storage = remember ? localStorage : sessionStorage;
        if (token) storage.setItem("token", token);
        if (user) storage.setItem("user", JSON.stringify(user));
      } catch (_) {}

      setStatus("success");
      if (onLoginSuccess && user) onLoginSuccess(user);
      return { token, user };
    } catch (e) {
      setStatus("error");
      setErrorMsg(e.message || "Erreur lors de la connexion");
      return null;
    }
  };

  return { status, errorMsg, handleSubmit };
}