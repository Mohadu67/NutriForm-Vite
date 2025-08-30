import React, { useEffect, useMemo, useState } from "react";
import style from "./HistoryUser.module.css";
import BoutonAction from "../../BoutonAction/BoutonAction.jsx";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

function LineChartSVG({ points = [], width = 320, height = 140, color = "currentColor", yLabel = "" }) {
  if (!Array.isArray(points) || points.length < 2) return null;

  const data = points
    .filter(p => p && typeof p.value === 'number' && p.date)
    .map(p => ({ x: new Date(p.date), y: Number(p.value) }))
    .sort((a, b) => a.x - b.x);

  if (data.length < 2) return null;

  const pad = { left: 32, right: 8, top: 8, bottom: 24 };
  const W = width; const H = height;
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;

  const minX = data[0].x.getTime();
  const maxX = data[data.length - 1].x.getTime();
  let minY = Math.min(...data.map(d => d.y));
  let maxY = Math.max(...data.map(d => d.y));
  if (minY === maxY) { minY -= 1; maxY += 1; }
  const yPad = (maxY - minY) * 0.1;
  minY -= yPad; maxY += yPad;

  const xScale = (t) => pad.left + (innerW * (t - minX)) / Math.max(1, (maxX - minX));
  const yScale = (v) => pad.top + innerH - (innerH * (v - minY)) / (maxY - minY);

  let d = "";
  data.forEach((pt, i) => {
    const X = xScale(pt.x.getTime());
    const Y = yScale(pt.y);
    d += (i === 0 ? `M ${X} ${Y}` : ` L ${X} ${Y}`);
  });

  const first = data[0];
  const last = data[data.length - 1];
  const yMinText = minY.toFixed(1);
  const yMaxText = maxY.toFixed(1);

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-label={`Courbe ${yLabel}`}>
      <line x1={pad.left} y1={pad.top} x2={pad.left} y2={H - pad.bottom} stroke="#ddd" />
      <line x1={pad.left} y1={H - pad.bottom} x2={W - pad.right} y2={H - pad.bottom} stroke="#ddd" />
      <text x={4} y={yScale(minY)} fontSize="10" fill="#666">{yMinText}</text>
      <text x={4} y={yScale(maxY)} fontSize="10" fill="#666">{yMaxText}</text>
      <path d={d} fill="none" stroke={color} strokeWidth="2" />
      {data.map((pt, i) => (
        <circle key={i} cx={xScale(pt.x.getTime())} cy={yScale(pt.y)} r="2.5" fill={color} />
      ))}
      <text x={pad.left} y={H - 6} fontSize="10" fill="#666">{first.x.toLocaleDateString()}</text>
      <text x={W - pad.right - 64} y={H - 6} fontSize="10" fill="#666">{last.x.toLocaleDateString()}</text>
    </svg>
  );
}

export default function HistoryUser({ onClose, onLogout }) {
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [displayName, setDisplayName] = useState("");

  const getToken = () =>
    localStorage.getItem('token') ||
    sessionStorage.getItem('token') ||
    localStorage.getItem('jwt') ||
    localStorage.getItem('accessToken');

  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('user') || 'null');
      const cachedName = cached?.prenom || cached?.pseudo || cached?.displayName || (cached?.email ? String(cached.email).split('@')[0] : '');
      if (cachedName) setDisplayName(cachedName);
    } catch (_) {}

    const token = getToken();
    if (!token) {
      setError("Non connecté. Connecte-toi d'abord.");
      return;
    }

    setStatus("loading");
    setError("");

    fetch(`${API_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })).catch(() => ({ ok: res.ok, data: {} })))
      .then(({ ok, data }) => {
        if (!ok) return;
        const name = data?.prenom || data?.pseudo || data?.displayName || (data?.email ? String(data.email).split('@')[0] : '');
        if (name) setDisplayName(name);
      })
      .catch(() => {});

    fetch(`${API_URL}/api/history`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })).catch(() => ({ ok: res.ok, data: {} })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data?.message || "Erreur HTTP");

        const src = Array.isArray(data) ? data : (Array.isArray(data?.history) ? data.history : []);
        const list = src
          .map((r) => {
            const m = r?.meta || {};
            const date = r?.createdAt ? new Date(r.createdAt) : (m?.date ? new Date(m.date) : new Date());
            if (r?.action === 'IMC_CALC') {
              const value = Number(m?.imc);
              return Number.isFinite(value)
                ? {
                    id: r?._id,
                    type: 'imc',
                    value,
                    date,
                    poids: typeof m?.poids === 'number' ? m.poids : undefined,
                    categorie: typeof m?.categorie === 'string' ? m.categorie : undefined,
                  }
                : null;
            }
            if (r?.action === 'CALORIES_CALC') {
              const value = Number(m?.calories ?? m?.kcal);
              return Number.isFinite(value)
                ? { id: r?._id, type: 'calories', value, date }
                : null;
            }
            return null; 
          })
          .filter(Boolean)
          .sort((a, b) => a.date - b.date);

        setRecords(list);
        setStatus("idle");
      })
      .catch((e) => {
        console.error(e);
        setError(e.message || "Erreur de chargement");
        setStatus("error");
      });
  }, []);

  const imcPoints = useMemo(() => records.filter(r => r.type === 'imc'), [records]);
  const calPoints = useMemo(() => records.filter(r => r.type === 'calories'), [records]);
  const weightPoints = useMemo(
    () => imcPoints
      .filter(r => typeof r.poids === 'number')
      .map(r => ({ value: r.poids, date: r.date })),
    [imcPoints]
  );

  const handleDelete = async (id) => {
    const token = getToken();
    if (!token || !id) return;
    const ok = window.confirm('Supprimer cette mesure ?');
    if (!ok) return;
    try {
      const res = await fetch(`${API_URL}/api/history/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setRecords((prev) => prev.filter((r) => r.id !== id));
      } else if (import.meta.env.DEV) {
        console.warn('DELETE /api/history failed', res.status, await res.text().catch(() => ''));
      }
    } catch (e) {
      if (import.meta.env.DEV) console.warn('DELETE /api/history error', e);
    }
  };

  return (
    <div className={style["popup-body"]}>
      <div className={style["popup-header-row"]}>
        <h3 className={style["popup-title"]}>Historique</h3>
        {displayName ? (
          <p className={style.muted}>Salut {displayName} 👋</p>
        ) : null}
      </div>

      {status === "loading" && <p>Chargement…</p>}
      {status === "error" && <p className={style["popup-error"]}>{error}</p>}

      {records.length === 0 && status === "idle" && (
        <p>Aucune donnée pour l'instant. Enregistre un IMC ou des calories pour voir la courbe.</p>
      )}

      <div className={style.historyGrid}>
        <section className={style.historySection}>
          <h4 className={style.sectionTitle}>Courbe Poids</h4>
          {weightPoints.length >= 2 ? (
            <LineChartSVG points={weightPoints} color="#4A90E2" yLabel="Poids (kg)" />
          ) : (
            <p className={style.muted}>Ajoute au moins 2 mesures avec un poids pour voir la courbe.</p>
          )}
        </section>

        <section className={style.historySection}>
          <h4 className={style.sectionTitle}>Courbe Calories</h4>
          {calPoints.length >= 2 ? (
            <LineChartSVG points={calPoints.map(r => ({ value: r.value, date: r.date }))} color="#F5A623" yLabel="Calories" />
          ) : (
            <p className={style.muted}>Ajoute au moins 2 mesures pour voir la courbe des calories.</p>
          )}
        </section>
      </div>

      <div className={style.recapGrid}>
        <section className={style.recapCard}>
          <h4 className={style.recapTitle}>Mes données IMC / Poids</h4>
          {imcPoints.length > 0 ? (
            (() => {
              const last = imcPoints[imcPoints.length - 1];
              return (
                <p className={style.recapLead}>
                  Dernier IMC : <strong>{last.value}</strong>
                  {last.date && (
                    <> (<span>{new Date(last.date).toLocaleDateString()}</span>)</>
                  )}
                  {typeof last.poids === 'number' && (
                    <> • <span>{last.poids} kg</span></>
                  )}
                  {last.categorie && (
                    <> • <span>{last.categorie}</span></>
                  )}
                </p>
              );
            })()
          ) : (
            <p className={style.muted}>Aucune mesure IMC enregistrée.</p>
          )}

          <div className={style.chipsWrap}>
            {imcPoints
              .slice()
              .sort((a, b) => b.date - a.date)
              .map((r, i) => (
                <button
                  type="button"
                  key={r.id || i}
                  className={style.chip}
                  title="Supprimer cette mesure"
                  onClick={() => handleDelete(r.id)}
                >
                  {r.value}
                  {r.date && <> <span className={style.muted}>(le {new Date(r.date).toLocaleDateString()})</span></>}
                </button>
              ))}
          </div>
        </section>

        <section className={style.recapCard}>
          <h4 className={style.recapTitle}>Mes données Calories</h4>
          {calPoints.length > 0 ? (
            (() => {
              const last = calPoints[calPoints.length - 1];
              return (
                <p className={style.recapLead}>
                  Dernières Calories : <strong>{last.value}</strong> kcal
                  {last.date && (
                    <> (<span>{new Date(last.date).toLocaleDateString()}</span>)</>
                  )}
                </p>
              );
            })()
          ) : (
            <p className={style.muted}>Aucune mesure calories enregistrée.</p>
          )}

          <div className={style.chipsWrap}>
            {calPoints
              .slice()
              .sort((a, b) => b.date - a.date)
              .map((r, i) => (
                <button
                  type="button"
                  key={r.id || i}
                  className={style.chip}
                  title="Supprimer cette mesure"
                  onClick={() => handleDelete(r.id)}
                >
                  <span className={style.chipValue}>{r.value}</span> kcal
                  {r.date && <> <span className={style.muted}>(le {new Date(r.date).toLocaleDateString()})</span></>}
                </button>
              ))}
          </div>
        </section>
      </div>

      {/* Suivi des entraînements (bientôt disponible) */}
      <section className={style.recapCard} style={{ marginTop: '1rem' }}>
        <h4 className={style.recapTitle}>Suivi des entraînements</h4>
        <p className={style.muted}>
          Patience, coach en pantoufles. Ton historique de séances arrive ici très bientôt.
        </p>
        <p className={style.muted} style={{ fontStyle: 'italic' }}>
          Bientôt disponible : « Ton classement contre tes potes… et contre toi-même. »
        </p>
      </section>

      <div className={style["popup-actions"]}>
        {onLogout && (
          <BoutonAction
            type="button"
            variant="logout"
            onClick={() => {
              try {
                localStorage.removeItem('token');
                sessionStorage.removeItem('token');
              } catch {}
              if (onLogout) onLogout();
            }}
          >
            Se déconnecter
          </BoutonAction>
        )}
      </div>
    </div>
  );
}