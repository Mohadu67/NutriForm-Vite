import React, { useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import style from '../Dashboard.module.css';

/* ─── Macro bar ─── */

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

/* ─── Slide 1: Resume de la semaine ─── */

function SlideWeeklySummary({ stats, weeklyCalories }) {
  if (!stats) return <div className={style.dcSlide} />;

  const items = [
    { label: 'Seances', value: stats.sessionsThisWeek, color: '#72baa1' },
    { label: 'Calories', value: `${weeklyCalories || stats.weeklyCalories || 0}`, color: '#f0a47a' },
    { label: 'Streak', value: `${stats.currentStreak}j`, color: '#c9a88c' },
    { label: 'Moy/seance', value: stats.avgSessionDurationMin > 0 ? `${stats.avgSessionDurationMin}min` : '-', color: '#72baa1' },
  ];

  const trend = stats.sessionsTrend;
  const trendText = trend?.direction === 'up'
    ? `+${trend.value} seance${trend.value > 1 ? 's' : ''} vs semaine derniere`
    : trend?.direction === 'down'
      ? `-${trend.value} seance${trend.value > 1 ? 's' : ''} vs semaine derniere`
      : null;

  return (
    <div className={style.dcSlide}>
      <div className={style.dcCard}>
        <h3 className={style.dcCardTitle}>Resume de la semaine</h3>
        <div className={style.dcSummaryGrid}>
          {items.map((item) => (
            <div key={item.label} className={style.dcSummaryItem}>
              <span className={style.dcSummaryVal} style={{ color: item.color }}>{item.value}</span>
              <span className={style.dcSummaryLbl}>{item.label}</span>
            </div>
          ))}
        </div>
        {trendText && (
          <p className={style.dcSummaryTrend}>
            {trend.direction === 'up' ? '↗' : '↘'} {trendText}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Slide 2: Nutrition du jour ─── */

function SlideNutrition({ nutrition }) {
  const navigate = useNavigate();
  if (!nutrition) return <div className={style.dcSlide} />;

  const { consumed, remaining, pct, burned } = nutrition;
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
            <span className={style.dcNutrStatVal}>{burned}</span>
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

/* ─── Main Carousel ─── */

export const DashboardCarousel = ({ stats, weeklyCalories, nutrition }) => {
  const scrollRef = useRef(null);
  const [active, setActive] = useState(0);
  const slidesCount = 2;

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
        <SlideWeeklySummary stats={stats} weeklyCalories={weeklyCalories} />
        <SlideNutrition nutrition={nutrition} />
      </div>
      <div className={style.dcDots}>
        {Array.from({ length: slidesCount }, (_, i) => (
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
