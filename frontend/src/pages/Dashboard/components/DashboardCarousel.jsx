import React, { useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import style from '../Dashboard.module.css';

const SLIDES_COUNT = 3;

/* ─── Slide 1: Nutrition du jour ─── */

function MacroBar({ label, current, goal, color }) {
  const pct = goal > 0 ? Math.min(current / goal, 1) : 0;
  return (
    <div className={style.nwMacro}>
      <span className={style.nwMacroLabel}>{label}</span>
      <div className={style.nwMacroTrack}>
        <div className={style.nwMacroFill} style={{ width: `${pct * 100}%`, background: color }} />
      </div>
      <span className={style.nwMacroValue}>{current}/{goal}g</span>
    </div>
  );
}

function SlideNutrition({ nutrition, navigate }) {
  if (!nutrition) return <div className={style.dcSlide} />;

  const { consumed, remaining, pct } = nutrition;
  const macros = nutrition.macros || {};
  const ringSize = 72;
  const sw = 5.5;
  const r = (ringSize - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;

  return (
    <div className={style.dcSlide}>
      <div className={style.dcCard} onClick={() => navigate('/nutrition')} style={{ cursor: 'pointer' }}>
        <h3 className={style.dcCardTitle}>Nutrition du jour</h3>
        <div className={style.dcNutrRow}>
          <div className={style.dcNutrStat}>
            <span className={style.dcNutrStatVal}>{consumed}</span>
            <span className={style.dcNutrStatLbl}>Mangees</span>
          </div>
          <div className={style.dcRingWrap}>
            <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
              <circle cx={ringSize / 2} cy={ringSize / 2} r={r} fill="none" className={style.statRingTrack} strokeWidth={sw} />
              <circle cx={ringSize / 2} cy={ringSize / 2} r={r} fill="none" stroke="#72baa1" strokeWidth={sw}
                strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
                transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
            </svg>
            <div className={style.dcRingText}>
              <span className={style.dcRingVal}>{remaining}</span>
              <span className={style.dcRingLbl}>Rest.</span>
            </div>
          </div>
          <div className={style.dcNutrStat}>
            <span className={style.dcNutrStatVal}>{nutrition.burned}</span>
            <span className={style.dcNutrStatLbl}>Brulees</span>
          </div>
        </div>
        {macros.proteins && (
          <div className={style.dcMacrosRow}>
            <MacroBar label="Prot." current={macros.proteins.consumed} goal={macros.proteins.goal} color="#72baa1" />
            <MacroBar label="Gluc." current={macros.carbs.consumed} goal={macros.carbs.goal} color="#f0a47a" />
            <MacroBar label="Lip." current={macros.fats.consumed} goal={macros.fats.goal} color="#c9a88c" />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Slide 2: Body Metrics ─── */

function SlideBody({ body }) {
  if (!body?.bmi && !body?.weight) return <div className={style.dcSlide} />;

  return (
    <div className={style.dcSlide}>
      <div className={style.dcCard}>
        <h3 className={style.dcCardTitle}>Mon corps</h3>
        <div className={style.dcBodyGrid}>
          {body.bmi && (
            <div className={style.dcBodyItem}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#72baa1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 20h10" /><path d="M12 11V8" /><path d="m8 8 4-5 4 5" />
                <circle cx="5" cy="14" r="3" /><circle cx="19" cy="14" r="3" />
              </svg>
              <span className={style.dcBodyVal}>{body.bmi}</span>
              <span className={style.dcBodyLbl}>IMC · {body.bmiLabel}</span>
            </div>
          )}
          {body.weight && (
            <div className={style.dcBodyItem}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f0a47a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
              <span className={style.dcBodyVal}>{body.weight} kg</span>
              <span className={style.dcBodyLbl}>Poids actuel</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Slide 3: Cardio Stats ─── */

const CARDIO_META = {
  run:  { label: 'Course',   color: '#72baa1', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="4" r="2" /><path d="M10 7.5h4" /><path d="M12 7.5v3" /><path d="m8 13 4-2 4 2" /><path d="M9 21l-5-6 2-3" /><path d="M15 21l5-6-2-3" /></svg> },
  bike: { label: 'Velo',     color: '#f0a47a', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5.5" cy="17.5" r="3.5" /><circle cx="18.5" cy="17.5" r="3.5" /><path d="m12 17.5-3.5-5.5 3.5-4.5" /><path d="M12 12h5.5L15 6" /></svg> },
  swim: { label: 'Natation', color: '#5a9e87', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="16" cy="5" r="2" /><path d="m14 8-2 4 3 2" /><path d="M3 18c.6-.6 1.7-.6 2.4 0 .8.8 2 .8 2.8 0s2-.8 2.8 0c.8.8 2 .8 2.8 0s2-.8 2.8 0c.8.8 2 .8 2.8 0" /></svg> },
  walk: { label: 'Marche',   color: '#c9a88c', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1" /><path d="M10 22v-5l-1-1v-4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4l-1 1v5" /></svg> },
};

function SlideCardio({ cardio }) {
  const entries = Object.entries(cardio || {}).filter(([, v]) => v > 0);
  if (entries.length === 0) {
    return (
      <div className={style.dcSlide}>
        <div className={style.dcCard}>
          <h3 className={style.dcCardTitle}>Cardio</h3>
          <p className={style.dcEmptyText}>Aucune distance enregistree</p>
        </div>
      </div>
    );
  }

  return (
    <div className={style.dcSlide}>
      <div className={style.dcCard}>
        <h3 className={style.dcCardTitle}>Distances parcourues</h3>
        <div className={style.dcCardioGrid}>
          {entries.map(([key, km]) => {
            const meta = CARDIO_META[key];
            if (!meta) return null;
            return (
              <div key={key} className={style.dcCardioItem}>
                <span className={style.dcCardioIcon} style={{ color: meta.color }}>{meta.icon}</span>
                <span className={style.dcCardioVal}>{km} km</span>
                <span className={style.dcCardioLbl}>{meta.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Dashboard Carousel ─── */

export const DashboardCarousel = ({ nutrition, body, cardio }) => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [active, setActive] = useState(0);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    setActive(Math.round(scrollLeft / clientWidth));
  }, []);

  const goTo = (idx) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ left: idx * scrollRef.current.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className={style.dcWrap}>
      <div className={style.dcScroll} ref={scrollRef} onScroll={handleScroll}>
        <SlideNutrition nutrition={nutrition} navigate={navigate} />
        <SlideBody body={body} />
        <SlideCardio cardio={cardio} />
      </div>
      <div className={style.dcDots}>
        {Array.from({ length: SLIDES_COUNT }, (_, i) => (
          <button
            key={i}
            className={`${style.dcDot} ${i === active ? style.dcDotActive : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
