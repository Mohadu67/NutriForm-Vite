import React, { useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import style from '../Dashboard.module.css';

/* ─── Macro bar ─── */

function MacroBar({ label, current, goal, color }) {
  const pct = goal > 0 ? Math.min(current / goal, 1) : 0;
  return (
    <div className={style.nwMacro}>
      <div className={style.nwMacroHeader}>
        <span className={style.nwMacroDot} style={{ backgroundColor: color }} />
        <span className={style.nwMacroLabel}>{label}</span>
      </div>
      <div className={style.nwMacroTrack}>
        <div className={style.nwMacroFill} style={{ width: `${pct * 100}%`, background: color }} />
      </div>
      <span className={style.nwMacroValue}>{current} / {goal} g</span>
    </div>
  );
}

/* ─── Motivation ─── */

function getMotivation(sessions, calories) {
  if (sessions === 0) return { title: "C'est pas grave !", message: 'Reste focus, une seance et tu es reparti !' };
  if (sessions <= 2) return { title: 'Bon debut !', message: `${sessions} seance${sessions > 1 ? 's' : ''} cette semaine, continue !` };
  if (sessions <= 4) return { title: 'Belle semaine !', message: `${sessions} seances${calories > 0 ? ` et ${calories} kcal brulees` : ''} !` };
  return { title: 'Semaine incroyable !', message: `${sessions} seances ! Tu es une machine !` };
}

/* ─── Tint colors for tips ─── */

const TINT_COLORS = {
  green: 'rgba(16, 185, 129, 0.07)',
  amber: 'rgba(245, 158, 11, 0.07)',
  red: 'rgba(239, 68, 68, 0.07)',
  blue: 'rgba(59, 130, 246, 0.07)',
};

/* ─── Slide 1: Resume semaine ─── */

function SlideWeeklySummary({ stats, weeklyCalories, bodyCompRecap, tips }) {
  if (!stats) return <div className={style.dcSlide} />;

  const sessions = stats.sessionsThisWeek || 0;
  const calories = weeklyCalories || stats.weeklyCalories || 0;
  const motivation = getMotivation(sessions, calories);
  const bc = bodyCompRecap;

  return (
    <div className={style.dcSlide}>
      <div className={style.dcCard}>
        {/* Motivation header */}
        <div className={style.dcMotiRow}>
          <div className={style.dcMotiIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#72baa1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
          </div>
          <div className={style.dcMotiText}>
            <span className={style.dcMotiTitle}>{motivation.title}</span>
            <span className={style.dcMotiMsg}>{motivation.message}</span>
          </div>
        </div>

        {/* Stats row */}
        <div className={style.dcStatsRow}>
          <div className={style.dcStatItem}>
            <span className={style.dcStatVal}>{sessions}</span>
            <span className={style.dcStatLbl}>seance{sessions !== 1 ? 's' : ''}</span>
          </div>
          {calories > 0 && (
            <div className={style.dcStatItem}>
              <span className={style.dcStatVal}>{calories}</span>
              <span className={style.dcStatLbl}>kcal</span>
            </div>
          )}
          {stats.currentStreak > 0 && (
            <div className={style.dcStatItem}>
              <span className={style.dcStatVal}>{stats.currentStreak}</span>
              <span className={style.dcStatLbl}>jour{stats.currentStreak > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Bilan nutrition */}
        {bc && bc.daysLogged >= 1 && (
          <div className={style.dcNutrRecap}>
            <span className={style.dcNutrRecapTitle}>Bilan nutrition</span>
            <div className={style.dcNutrRecapGrid}>
              <div className={style.dcNutrRecapItem}>
                <span className={style.dcNutrRecapVal}>{bc.avgCalories}</span>
                <span className={style.dcNutrRecapLbl}>kcal/jour</span>
              </div>
              <div className={style.dcNutrRecapItem}>
                <span className={style.dcNutrRecapVal}>{bc.avgProteins}g</span>
                <span className={style.dcNutrRecapLbl}>prot ({bc.proteinPerKg}g/kg)</span>
              </div>
              {bc.dailyBalance !== undefined && (
                <div className={style.dcNutrRecapItem}>
                  <span className={style.dcNutrRecapVal} style={{ color: bc.dailyBalance >= 0 ? '#f0a47a' : '#72baa1' }}>
                    {bc.dailyBalance >= 0 ? '+' : ''}{Math.round(bc.dailyBalance)}
                  </span>
                  <span className={style.dcNutrRecapLbl}>{bc.dailyBalance >= 0 ? 'surplus' : 'deficit'}</span>
                </div>
              )}
            </div>
            {/* Tags */}
            <div className={style.dcTags}>
              {bc.muscleGainG > 0 && (
                <span className={style.dcTag} style={{ color: '#059669' }}>+{bc.muscleGainG}g muscle</span>
              )}
              <span className={style.dcTag} style={{ color: bc.fatChangeG > 0 ? '#ef4444' : '#059669' }}>
                {bc.fatChangeG >= 0 ? '+' : ''}{bc.fatChangeG}g gras
              </span>
              {bc.projectedWeight && (
                <span className={style.dcTag}>Proj. {bc.projectedWeight} kg</span>
              )}
            </div>
          </div>
        )}

        {/* Tips carousel (toujours visible) */}
        {tips && tips.length > 0 && (
          <div className={style.dcTipsScroll}>
            {tips.map((tip, i) => (
              <div key={i} className={style.dcTipCard} style={{ background: TINT_COLORS[tip.tint] || TINT_COLORS.blue }}>
                <span className={style.dcTipTitle}>{tip.title}</span>
                <span className={style.dcTipText}>{tip.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Slide 2: Nutrition du jour (mobile-style) ─── */

function SlideNutrition({ nutrition }) {
  const navigate = useNavigate();
  if (!nutrition) {
    return (
      <div className={style.dcSlide}>
        <div className={style.dcCard}>
          <h3 className={style.dcCardTitle}>Nutrition du jour</h3>
          <p className={style.dcEmptyText}>Aucune donnee nutrition</p>
        </div>
      </div>
    );
  }

  const { consumed, goal, remaining, pct, burned } = nutrition;
  const macros = nutrition.macros || {};
  const ringSize = 120;
  const sw = 8;
  const r = (ringSize - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;

  return (
    <div className={style.dcSlide}>
      <div className={style.dcCard} onClick={() => navigate('/nutrition')} style={{ cursor: 'pointer' }}>
        <h3 className={style.dcCardTitle}>Nutrition du jour</h3>

        {/* Ring centre */}
        <div className={style.nwGaugeCenter}>
          <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
            <circle cx={ringSize / 2} cy={ringSize / 2} r={r} fill="none" className={style.statRingTrack} strokeWidth={sw} />
            {pct > 0 && (
              <circle cx={ringSize / 2} cy={ringSize / 2} r={r} fill="none" stroke="#72baa1" strokeWidth={sw}
                strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
                transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
            )}
          </svg>
          <div className={style.nwGaugeCenterText}>
            <span className={style.nwGaugeVal}>{remaining}</span>
            <span className={style.nwGaugeLbl}>restantes</span>
          </div>
        </div>

        {/* Meta row: Objectif | Consomme | Brule */}
        <div className={style.nwMetaRow}>
          <div className={style.nwMetaItem}>
            <span className={style.nwMetaVal}>{goal}</span>
            <span className={style.nwMetaLbl}>Objectif</span>
          </div>
          <div className={style.nwMetaSep} />
          <div className={style.nwMetaItem}>
            <span className={style.nwMetaVal}>{consumed}</span>
            <span className={style.nwMetaLbl}>Consomme</span>
          </div>
          <div className={style.nwMetaSep} />
          <div className={style.nwMetaItem}>
            <span className={style.nwMetaVal}>{burned}</span>
            <span className={style.nwMetaLbl}>Brule</span>
          </div>
        </div>

        {/* Macros bars with dot */}
        {macros.proteins && (
          <div className={style.nwMacrosCol}>
            <MacroBar label="Glucides" current={macros.carbs.consumed} goal={macros.carbs.goal} color="#f0a47a" />
            <MacroBar label="Proteines" current={macros.proteins.consumed} goal={macros.proteins.goal} color="#72baa1" />
            <MacroBar label="Lipides" current={macros.fats.consumed} goal={macros.fats.goal} color="#c9a88c" />
          </div>
        )}

        <button className={style.nwAddMealBtn}
          onClick={(e) => { e.stopPropagation(); navigate('/nutrition', { state: { openAddMeal: true } }); }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
          Ajouter un repas
        </button>
      </div>
    </div>
  );
}

/* ─── Main Carousel ─── */

export const DashboardCarousel = ({ stats, weeklyCalories, nutrition, bodyCompRecap, tips }) => {
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
        <SlideWeeklySummary stats={stats} weeklyCalories={weeklyCalories} bodyCompRecap={bodyCompRecap} tips={tips} />
        <SlideNutrition nutrition={nutrition} />
      </div>
      <div className={style.dcDots}>
        {Array.from({ length: slidesCount }, (_, i) => (
          <button key={i} className={`${style.dcDot} ${i === active ? style.dcDotActive : ''}`}
            onClick={() => goTo(i)} aria-label={`Slide ${i + 1}`} />
        ))}
      </div>
    </div>
  );
};
