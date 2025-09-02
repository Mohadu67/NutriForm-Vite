import { useState } from "react";

export default function useLogin(onLoginSuccess) {
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async ({ identifier, password, remember }) => {
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(`/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include", // indispensable pour stocker le cookie JWT côté navigateur
        body: JSON.stringify({ identifier, password, remember }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Échec de connexion");
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