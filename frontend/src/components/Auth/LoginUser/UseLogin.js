import { useState } from "react";
import { toast } from 'sonner';
import { login as secureLogin } from '../../../utils/authService';

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

      // Utiliser le service d'authentification sécurisé
      const result = await secureLogin(identifier, password, remember);

      if (!result.success) {
        throw new Error(result.message || "Échec de connexion");
      }

      const { user } = result;

      // Vérifier s'il y a une redirection après login
      const redirectPath = sessionStorage.getItem("redirectAfterLogin");
      if (redirectPath) {
        sessionStorage.removeItem("redirectAfterLogin");
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 1000);
      }

      const end = (typeof performance !== "undefined" ? performance.now() : Date.now());
      const elapsed = end - start;
      if (elapsed < minDurationMs) {
        await sleep(minDurationMs - elapsed);
      }

      setStatus("success");
      toast.success("Connexion réussie !");
      if (onLoginSuccess && user) onLoginSuccess(user);
      return { user };
    } catch (e) {
      const end = (typeof performance !== "undefined" ? performance.now() : Date.now());
      const elapsed = end - start;
      if (elapsed < minDurationMs) {
        await sleep(minDurationMs - elapsed);
      }

      setStatus("error");
      const message = e instanceof Error ? e.message : "Erreur lors de la connexion";
      setErrorMsg(message);
      toast.error(message);
      return null;
    }
  };

  return { status, errorMsg, handleSubmit };
}
