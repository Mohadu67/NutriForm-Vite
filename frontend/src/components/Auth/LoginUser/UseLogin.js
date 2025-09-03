import { useState } from "react";

export default function useLogin(onLoginSuccess) {
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async ({ identifier, password, remember }) => {
    setStatus("loading");
    setErrorMsg("");

    try {
      const endpoint = `${import.meta.env.VITE_API_URL}/api/login`;

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

      try {
        const storage = remember ? localStorage : sessionStorage;
        if (token) storage.setItem("token", token);
        if (user) storage.setItem("user", JSON.stringify(user));
      } catch (_) {}

      await new Promise((resolve) => setTimeout(resolve, 4000));

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