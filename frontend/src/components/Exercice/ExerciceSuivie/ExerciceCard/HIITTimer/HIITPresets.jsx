import { memo, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './HIITPresets.module.css';

const PRESETS = [
  {
    id: 'tabata',
    name: 'Tabata',
    emoji: '⚡',
    description: 'Classique - 20s work / 10s rest',
    workDuration: 20,
    restDuration: 10,
    rounds: 8,
  },
  {
    id: 'emom',
    name: 'EMOM',
    emoji: '⏱️',
    description: 'Every Minute On Minute - 40s work / 20s rest',
    workDuration: 40,
    restDuration: 20,
    rounds: 10,
  },
  {
    id: 'amrap',
    name: 'AMRAP',
    emoji: '🔥',
    description: 'As Many Reps As Possible - 45s work / 15s rest',
    workDuration: 45,
    restDuration: 15,
    rounds: 12,
  },
  {
    id: 'beginner',
    name: 'Débutant',
    emoji: '🌱',
    description: 'Plus de repos - 30s work / 30s rest',
    workDuration: 30,
    restDuration: 30,
    rounds: 6,
  },
  {
    id: 'advanced',
    name: 'Avancé',
    emoji: '💪',
    description: 'Intense - 50s work / 10s rest',
    workDuration: 50,
    restDuration: 10,
    rounds: 15,
  },
];

function HIITPresets({ onSelect, onClose }) {
  const [showCustom, setShowCustom] = useState(false);
  const [customConfig, setCustomConfig] = useState({
    workDuration: 30,
    restDuration: 15,
    rounds: 8,
  });

  const handlePresetClick = (preset) => {
    onSelect({
      workDuration: preset.workDuration,
      restDuration: preset.restDuration,
      rounds: preset.rounds,
      name: preset.name,
    });
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    onSelect({
      ...customConfig,
      name: 'Personnalisé',
    });
  };

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h3 className={styles.title}>Choisis ton programme HIIT</h3>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Fermer"
          >
            ×
          </button>
        </header>

        <div className={styles.content}>
          {!showCustom ? (
            <>
              {/* Presets Grid */}
              <div className={styles.presetsGrid}>
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={styles.presetCard}
                    onClick={() => handlePresetClick(preset)}
                  >
                    <div className={styles.presetEmoji}>{preset.emoji}</div>
                    <div className={styles.presetName}>{preset.name}</div>
                    <div className={styles.presetDesc}>{preset.description}</div>
                    <div className={styles.presetDetails}>
                      <span>{preset.workDuration}s work</span>
                      <span className={styles.separator}>•</span>
                      <span>{preset.restDuration}s rest</span>
                      <span className={styles.separator}>•</span>
                      <span>{preset.rounds} rounds</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom Button */}
              <button
                type="button"
                className={styles.customBtn}
                onClick={() => setShowCustom(true)}
              >
                ⚙️ Configuration personnalisée
              </button>
            </>
          ) : (
            <>
              {/* Custom Form */}
              <form className={styles.customForm} onSubmit={handleCustomSubmit}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Durée travail (secondes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={customConfig.workDuration}
                    onChange={(e) =>
                      setCustomConfig((prev) => ({
                        ...prev,
                        workDuration: parseInt(e.target.value) || 30,
                      }))
                    }
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Durée repos (secondes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={customConfig.restDuration}
                    onChange={(e) =>
                      setCustomConfig((prev) => ({
                        ...prev,
                        restDuration: parseInt(e.target.value) || 15,
                      }))
                    }
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Nombre de rounds</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={customConfig.rounds}
                    onChange={(e) =>
                      setCustomConfig((prev) => ({
                        ...prev,
                        rounds: parseInt(e.target.value) || 8,
                      }))
                    }
                    className={styles.input}
                  />
                </div>

                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.backBtn}
                    onClick={() => setShowCustom(false)}
                  >
                    Retour
                  </button>
                  <button type="submit" className={styles.submitBtn}>
                    Valider
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default memo(HIITPresets);
