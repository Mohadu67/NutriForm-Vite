import React, { useRef, useEffect } from 'react';
import style from '../NutritionPage.module.css';

const RING_R = 19;
const RING_SIZE = 46;
const CIRC = 2 * Math.PI * RING_R;

/**
 * Returns a color based on the backend-computed progressPct.
 * Pure display concern — no business logic.
 */
function ringColor(pct) {
  if (pct < 25) return '#b8ddd0';
  if (pct < 50) return '#90c9b5';
  if (pct < 75) return '#72baa1';
  return '#4d9e84';
}

function DayRing({ hasData, progressPct, isFuture }) {
  if (isFuture) {
    return (
      <svg className={style.weekRingSvg} width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
        <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R} fill="none" className={style.weekRingFuture} strokeWidth={1.5} />
      </svg>
    );
  }

  if (!hasData) {
    return (
      <svg className={style.weekRingSvg} width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
        <circle
          cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
          fill="none" className={style.weekRingDashed}
          strokeWidth={2} strokeDasharray="4 3.5"
        />
      </svg>
    );
  }

  const offset = CIRC - (Math.min(progressPct, 100) / 100) * CIRC;

  return (
    <svg className={style.weekRingSvg} width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
      <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R} fill="none" className={style.weekRingTrack} strokeWidth={2} />
      <circle
        cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
        fill="none" stroke={ringColor(progressPct)} strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray={CIRC}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
        style={{ transition: 'stroke-dashoffset 0.4s ease' }}
      />
    </svg>
  );
}

/**
 * WeekBar — horizontal scrollable week navigation.
 *
 * Props:
 * - selectedDate: ISO string (YYYY-MM-DD)
 * - onChange: (isoDate) => void
 * - weeks: backend data — array of arrays, each sub-array = 7 day objects
 *          Each day: { date, hasData, consumed, progressPct }
 *          May be null/undefined if data hasn't loaded yet.
 */
export default function WeekBar({ selectedDate, onChange, weeks }) {
  const scrollRef = useRef(null);
  const selectedWeekRef = useRef(null);
  const today = new Date().toISOString().split('T')[0];

  // On mount, scroll to the week containing the selected date
  useEffect(() => {
    if (selectedWeekRef.current) {
      selectedWeekRef.current.scrollIntoView({ inline: 'start', block: 'nearest', behavior: 'auto' });
    }
  }, []);

  if (!weeks || weeks.length === 0) return null;

  // Find the week index that contains the selected date
  const selectedWeekIdx = weeks.findIndex((w) => w.some((d) => d.date === selectedDate));

  return (
    <div className={style.weekBar} ref={scrollRef}>
      {weeks.map((week, wi) => (
        <div
          key={wi}
          className={style.weekGroup}
          ref={wi === selectedWeekIdx ? selectedWeekRef : null}
        >
          {week.map((d) => {
            const isSelected = d.date === selectedDate;
            const isFuture = d.date > today;
            const dayDate = new Date(d.date + 'T12:00:00');
            const dayLabel = dayDate.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '');

            return (
              <div
                key={d.date}
                className={`${style.weekDayCol} ${isSelected ? style.weekDayColSelected : ''}`}
              >
                <span className={`${style.weekDayLabel} ${isSelected ? style.weekDayLabelBold : ''}`}>
                  {dayLabel}
                </span>
                <button
                  className={style.weekDayBtn}
                  onClick={() => !isFuture && onChange(d.date)}
                  disabled={isFuture}
                >
                  <DayRing hasData={d.hasData} progressPct={d.progressPct} isFuture={isFuture} />
                  <span className={`${style.weekDayNum} ${isFuture ? style.weekDayNumMuted : ''}`}>
                    {dayDate.getDate()}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
