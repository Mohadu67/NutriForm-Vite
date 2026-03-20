import styles from './StepAvailability.module.css';
import { XIcon } from '../../../components/Icons/GlobalIcons';

const DAYS = [
  { key: 'monday', label: 'Lundi', short: 'Lun' },
  { key: 'tuesday', label: 'Mardi', short: 'Mar' },
  { key: 'wednesday', label: 'Mercredi', short: 'Mer' },
  { key: 'thursday', label: 'Jeudi', short: 'Jeu' },
  { key: 'friday', label: 'Vendredi', short: 'Ven' },
  { key: 'saturday', label: 'Samedi', short: 'Sam' },
  { key: 'sunday', label: 'Dimanche', short: 'Dim' }
];

export default function StepAvailability({ availability, setAvailability }) {
  const addTimeSlot = (day) => {
    setAvailability(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), { start: '18:00', end: '20:00' }]
    }));
  };

  const removeTimeSlot = (day, index) => {
    setAvailability(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index)
    }));
  };

  const updateTimeSlot = (day, index, field, value) => {
    setAvailability(prev => ({
      ...prev,
      [day]: prev[day].map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const totalSlots = Object.values(availability).reduce((sum, slots) => sum + (slots?.length || 0), 0);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>Mes disponibilites</h3>
        <p className={styles.cardDesc}>
          Indiquez quand vous etes disponible pour vous entrainer
          {totalSlots > 0 && <span className={styles.badge}>{totalSlots} creneau{totalSlots > 1 ? 'x' : ''}</span>}
        </p>
      </div>

      <div className={styles.daysList}>
        {DAYS.map((day) => {
          const slots = availability[day.key] || [];
          return (
            <div key={day.key} className={styles.dayRow}>
              <div className={styles.dayHeader}>
                <span className={styles.dayLabel}>{day.label}</span>
                <button
                  type="button"
                  className={styles.addBtn}
                  onClick={() => addTimeSlot(day.key)}
                >
                  + Ajouter
                </button>
              </div>

              {slots.length === 0 && (
                <p className={styles.empty}>Aucun creneau</p>
              )}

              {slots.map((slot, index) => (
                <div key={index} className={styles.slotRow}>
                  <input
                    type="time"
                    className={styles.timeInput}
                    value={slot.start}
                    onChange={(e) => updateTimeSlot(day.key, index, 'start', e.target.value)}
                  />
                  <span className={styles.sep}>a</span>
                  <input
                    type="time"
                    className={styles.timeInput}
                    value={slot.end}
                    onChange={(e) => updateTimeSlot(day.key, index, 'end', e.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => removeTimeSlot(day.key, index)}
                  >
                    <XIcon size={14} />
                  </button>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
