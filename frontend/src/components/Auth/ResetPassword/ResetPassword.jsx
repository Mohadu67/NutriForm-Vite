import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

export default function ResetPassword() {
  const [sp] = useSearchParams();
  const token = sp.get("token") || "";
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (pwd.length < 8) return setMsg("Min 8 caractères.");
    if (pwd !== pwd2) return setMsg("Les mots de passe ne correspondent pas.");
    try {
      const res = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: pwd }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Erreur serveur");
      setMsg("Mot de passe modifié. Redirection…");
      setTimeout(() => navigate("/"), 1000);
    } catch (err) {
      setMsg(err.message);
    }
  };

  if (!token) return <main style={{maxWidth:420,margin:"40px auto"}}>Lien invalide ou expiré.</main>;

  return (
    <main style={{ maxWidth: 480, margin: "40px auto", padding: 16 }}>
      <h1>Réinitialiser le mot de passe</h1>
      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <input
          type="password"
          placeholder="Nouveau mot de passe"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirmer le mot de passe"
          value={pwd2}
          onChange={(e) => setPwd2(e.target.value)}
        />
        <button type="submit">Valider</button>
        {msg ? <p>{msg}</p> : null}
      </form>
    </main>
  );
}