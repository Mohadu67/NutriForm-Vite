import React, { useEffect, useMemo, useState } from "react";
import style from "./HistoryUser.module.css";


const API_URL = import.meta.env.VITE_API_URL || "";

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
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError("Non connecté. Connecte-toi d'abord.");
      return;
    }
    setStatus("loading");
    setError("");

    fetch(`${API_URL}/api/history`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })).catch(() => ({ ok: res.ok, data: {} })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data?.message || "Erreur HTTP");

        const src = Array.isArray(data.history) ? data.history : [];
        const list = src
          .map((r) => ({
            type: r?.type,
            value: Number(r?.value),
            date: r?.date ? new Date(r.date) : new Date(),
            poids: typeof r?.poids === 'number' ? r.poids : undefined,
            categorie: typeof r?.categorie === 'string' ? r.categorie : undefined,
          }))
          .filter((r) => (r.type === 'imc' || r.type === 'calories') && Number.isFinite(r.value));

        list.sort((a, b) => a.date - b.date); // asc for charts
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

  return (
    <div className={style["popup-body"]}>
      <div className={style["popup-header-row"]}>
        <h3 className={style["popup-title"]}>Historique</h3>
      </div>

      {status === "loading" && <p>Chargement…</p>}
      {status === "error" && <p className={style["popup-error"]}>{error}</p>}

      {records.length === 0 && status === "idle" && (
        <p>Aucune donnée pour l'instant. Enregistre un IMC ou des calories pour voir la courbe.</p>
      )}

      {/* Courbes */}
      <div className={style.historyGrid}>
        {/* Courbe Poids (à partir des mesures IMC avec poids) */}
        <section className={style.historySection}>
          <h4 className={style.sectionTitle}>Courbe Poids</h4>
          {weightPoints.length >= 2 ? (
            <LineChartSVG points={weightPoints} color="#4A90E2" yLabel="Poids (kg)" />
          ) : (
            <p className={style.muted}>Ajoute au moins 2 mesures avec un poids pour voir la courbe.</p>
          )}
        </section>

        {/* Courbe Calories */}
        <section className={style.historySection}>
          <h4 className={style.sectionTitle}>Courbe Calories</h4>
          {calPoints.length >= 2 ? (
            <LineChartSVG points={calPoints.map(r => ({ value: r.value, date: r.date }))} color="#F5A623" yLabel="Calories" />
          ) : (
            <p className={style.muted}>Ajoute au moins 2 mesures pour voir la courbe des calories.</p>
          )}
        </section>
      </div>

      {/* Résumés + listes sous les courbes (IMC/Poids à gauche, Calories à droite) */}
      <div className={style.recapGrid}>
        {/* Bloc IMC/Poids */}
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
                <span key={i} className={style.chip}>
                  {r.value}
                  {r.date && <> <span className={style.muted}>(le {new Date(r.date).toLocaleDateString()})</span></>}
                </span>
              ))}
          </div>
        </section>

        {/* Bloc Calories */}
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
                <span key={i} className={style.chip}>
                  {r.value} kcal
                  {r.date && <> <span className={style.muted}>(le {new Date(r.date).toLocaleDateString()})</span></>}
                </span>
              ))}
          </div>
        </section>
      </div>

      {/* Liste simple */}
      <div className={style.historyList}>
        {records
          .slice()
          .sort((a, b) => b.date - a.date) // desc for list
          .map((r, i) => (
            <div key={i} className={style.row}>
              <span className={style.label} style={{ textTransform: 'capitalize' }}>{r.type}</span>
              <span className={style.value}>
                {r.value}
                {r.type === 'imc' && typeof r.poids === 'number' && (
                  <span className={style.muted}>({r.poids} kg)</span>
                )}
                {r.type === 'imc' && r.categorie && (
                  <span className={style.muted}>{r.categorie}</span>
                )}
              </span>
              <span className={style.date}>{new Date(r.date).toLocaleString()}</span>
            </div>
          ))}
      </div>

      <div className={style["popup-actions"]}>
        {onLogout && (
          <button
            type="button"
            className={style["popup-link"]}
            onClick={() => {
              localStorage.removeItem('token');
              if (onLogout) onLogout();
            }}
          >
            Se déconnecter
          </button>
        )}
      </div>
    </div>
  );
}