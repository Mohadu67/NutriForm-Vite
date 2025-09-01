

import { useState } from "react";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function useLogin(onLoginSuccess) {
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async ({ identifier, password, remember }) => {
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Échec de connexion");
      }

      const data = await res.json();
      const { token, user } = data;

      if (!token || !user) throw new Error("Réponse invalide du serveur");

      if (remember) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("user", JSON.stringify(user));
      }

      setStatus("success");
      if (onLoginSuccess) onLoginSuccess(user);
      return { token, user };
    } catch (e) {
      setStatus("error");
      setErrorMsg(e.message || "Erreur lors de la connexion");
      return null;
    }
  };

  return { status, errorMsg, handleSubmit };
}