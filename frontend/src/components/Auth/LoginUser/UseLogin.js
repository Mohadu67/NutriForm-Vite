import { useState } from "react";
import { toast } from 'sonner';
import { login as secureLogin } from '../../../utils/authService';
import logger from '../../../shared/utils/logger.js';

export default function useLogin(onLoginSuccess, options = {}) {
  const { minDurationMs = 2500 } = options;
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);

  const handleSubmit = async ({ identifier, password, remember }) => {
    setStatus("loading");
    setErrorMsg("");
    setUnverifiedEmail(null);
    const start = (typeof performance !== "undefined" ? performance.now() : Date.now());
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    try {
      if (!identifier || !password) {
        throw new Error("Identifiant et mot de passe sont requis.");
      }


      const result = await secureLogin(identifier, password, remember);

      if (!result.success) {
        // Vérifier si c'est une erreur d'email non vérifié
        const isUnverified = result.message && result.message.toLowerCase().includes('non vérifié');
        if (isUnverified) {
          setUnverifiedEmail(identifier);
        }
        throw new Error(result.message || "Échec de connexion");
      }

      const { user } = result;


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

  const resendVerification = async () => {
    if (!unverifiedEmail) return;

    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_URL}/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: unverifiedEmail })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Email de vérification renvoyé !');
        setUnverifiedEmail(null);
      } else {
        toast.error(data.message || 'Erreur lors du renvoi de l\'email');
      }
    } catch (error) {
      logger.error('Erreur resendVerification:', error);
      toast.error('Erreur lors du renvoi de l\'email');
    }
  };

  return { status, errorMsg, unverifiedEmail, handleSubmit, resendVerification };
}
