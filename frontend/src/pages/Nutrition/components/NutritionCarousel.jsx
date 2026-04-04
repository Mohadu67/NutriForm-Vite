import React, { useRef, useState, useCallback } from 'react';
import { FlameIcon } from '../../../components/Icons/GlobalIcons';
import {
  ProteinIcon, CarbsIcon, FatsIcon,
  FiberIcon, SugarIcon, SodiumIcon,
  SunriseIcon, SunFullIcon, MoonIcon, AppleIcon,
} from './NutritionIcons';
import style from '../NutritionPage.module.css';

/* ─── Display config (UI concern — brand colors only) ─── */

const MACRO_META = {
  proteins: { label: 'Proteines', Icon: ProteinIcon, color: '#72baa1' },
  carbs:    { label: 'Glucides',  Icon: CarbsIcon,   color: '#f0a47a' },
  fats:     { label: 'Lipides',   Icon: FatsIcon,     color: '#c9a88c' },
};

const MICRO_META = {
  fiber:  { label: 'Fibres',  Icon: FiberIcon,  color: '#5a9e87' },
  sugar:  { label: 'Sucres',  Icon: SugarIcon,  color: '#d4895a' },
  sodium: { label: 'Sodium',  Icon: SodiumIcon, color: '#a88b70' },
};

const MEAL_META = {
  breakfast: { label: 'Petit-dej',  Icon: SunriseIcon,  color: '#f0a47a' },
  lunch:     { label: 'Dejeuner',   Icon: SunFullIcon,  color: '#72baa1' },
  dinner:    { label: 'Diner',      Icon: MoonIcon,     color: '#5a9e87' },
  snack:     { label: 'Collation',  Icon: AppleIcon,    color: '#c9a88c' },
};

const SLIDES_COUNT = 3;

/* ─── Mini ring (shared by macro/micro cards) ─── */

function MiniRing({ pct, color, Icon, size = 52, sw = 4.5 }) {
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;

  return (
    <div className={style.miniRingWrap}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" className={style.ringTrack} strokeWidth={sw} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <span className={style.miniRingIcon} style={{ color }}>
        <Icon size={16} />
      </span>
    </div>
  );
}

/* ─── Calorie ring (bigger) ─── */

function CalorieRing({ pct, size = 76, sw = 5.5 }) {
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;

  return (
    <div className={style.calorieCardRingWrap}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" className={style.ringTrack} strokeWidth={sw} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="#72baa1" strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <span className={style.calorieRingIcon}>
        <FlameIcon size={20} />
      </span>
    </div>
  );
}

/* ─── Slide 1: Calories + Macros ─── */

function SlideCalories({ calories, macros }) {
  return (
    <div className={style.carouselSlide}>
      <div className={style.calorieCard}>
        <div className={style.calorieCardBody}>
          <div className={style.calorieCardLeft}>
            <span className={style.calorieCardValue}>{calories.remaining}</span>
            <span className={style.calorieCardLabel}>Calories restantes</span>
          </div>
          <CalorieRing pct={calories.progressPct} />
        </div>
        <div className={style.calorieCardMeta}>
          <div className={style.metaItem}>
            <span className={style.metaLabel}>Objectif</span>
            <span className={style.metaValue}>{calories.goal}</span>
          </div>
          <div className={style.metaSep} />
          <div className={style.metaItem}>
            <span className={style.metaLabel}>Consomme</span>
            <span className={style.metaValue}>{calories.consumed}</span>
          </div>
          <div className={style.metaSep} />
          <div className={style.metaItem}>
            <span className={style.metaLabel}>Brule</span>
            <span className={style.metaValue}>{calories.burned}</span>
          </div>
        </div>
      </div>

      <div className={style.triCards}>
        {macros.map((m) => {
          const meta = MACRO_META[m.key];
          return (
            <div key={m.key} className={style.triCard}>
              <span className={style.triCardValue} style={{ color: meta.color }}>
                {m.remaining}{m.unit}
              </span>
              <span className={style.triCardLabel}>{meta.label} rest.</span>
              <MiniRing pct={m.progressPct} color={meta.color} Icon={meta.Icon} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Slide 2: Micros + Health Score ─── */

function SlideMicros({ micros, healthScore }) {
  const scoreLabel = healthScore.score != null ? `${healthScore.score}/100` : 'N/A';

  return (
    <div className={style.carouselSlide}>
      <div className={style.triCards}>
        {micros.map((m) => {
          const meta = MICRO_META[m.key];
          return (
            <div key={m.key} className={style.triCard}>
              <span className={style.triCardValue} style={{ color: meta.color }}>
                {m.remaining}{m.unit}
              </span>
              <span className={style.triCardLabel}>{meta.label} rest.</span>
              <MiniRing pct={m.progressPct} color={meta.color} Icon={meta.Icon} />
            </div>
          );
        })}
      </div>

      <div className={style.scoreCard}>
        <div className={style.scoreCardHeader}>
          <span className={style.scoreCardTitle}>Score de sante</span>
          <span className={style.scoreCardValue}>{scoreLabel}</span>
        </div>
        <div className={style.scoreBarBg}>
          <div
            className={style.scoreBarFill}
            style={{ width: `${healthScore.progressPct}%` }}
          />
        </div>
        <p className={style.scoreCardDesc}>
          {healthScore.score != null
            ? 'Ton score reflete la teneur nutritionnelle et l\'equilibre de ta journee.'
            : 'Suis quelques aliments pour generer ton score sante du jour.'}
        </p>
      </div>
    </div>
  );
}

/* ─── Slide 3: Meal Breakdown ─── */

function SlideMeals({ mealBreakdown, totalConsumed }) {
  const maxCal = Math.max(...mealBreakdown.map((m) => m.calories), 1);

  return (
    <div className={style.carouselSlide}>
      <div className={style.mealBreakdownCard}>
        <h3 className={style.mealBreakdownTitle}>Repartition par repas</h3>
        <div className={style.mealBreakdownRows}>
          {mealBreakdown.map((m) => {
            const meta = MEAL_META[m.key];
            return (
              <div key={m.key} className={style.mealBreakdownRow}>
                <span className={style.mealBreakdownIcon} style={{ color: meta.color }}>
                  <meta.Icon size={18} />
                </span>
                <span className={style.mealBreakdownLabel}>{meta.label}</span>
                <div className={style.mealBreakdownBarBg}>
                  <div
                    className={style.mealBreakdownBarFill}
                    style={{
                      width: `${(m.calories / maxCal) * 100}%`,
                      background: meta.color,
                    }}
                  />
                </div>
                <span className={style.mealBreakdownCal}>{m.calories}</span>
                <span className={style.mealBreakdownPct}>{m.pct}%</span>
              </div>
            );
          })}
        </div>
        <div className={style.mealBreakdownTotal}>
          Total consomme : <strong>{totalConsumed} kcal</strong>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Carousel ─── */

export default function NutritionCarousel({ data }) {
  const scrollRef = useRef(null);
  const [active, setActive] = useState(0);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const idx = Math.round(scrollLeft / clientWidth);
    setActive(idx);
  }, []);

  const goTo = (idx) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      left: idx * scrollRef.current.clientWidth,
      behavior: 'smooth',
    });
  };

  if (!data) return null;

  return (
    <div className={style.carousel}>
      <div className={style.carouselScroll} ref={scrollRef} onScroll={handleScroll}>
        <SlideCalories calories={data.calories} macros={data.macros} />
        <SlideMicros micros={data.micros} healthScore={data.healthScore} />
        <SlideMeals mealBreakdown={data.mealBreakdown} totalConsumed={data.calories.consumed} />
      </div>

      <div className={style.carouselDots}>
        {Array.from({ length: SLIDES_COUNT }, (_, i) => (
          <button
            key={i}
            className={`${style.carouselDot} ${i === active ? style.carouselDotActive : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
