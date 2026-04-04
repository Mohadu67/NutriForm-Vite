import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { SunriseIcon, SunFullIcon, MoonIcon, AppleIcon } from './NutritionIcons';
import style from '../NutritionPage.module.css';

const MEAL_OPTIONS = [
  { value: 'breakfast', label: 'Petit-dej', Icon: SunriseIcon, color: '#f0a47a' },
  { value: 'lunch',    label: 'Dejeuner',  Icon: SunFullIcon, color: '#72baa1' },
  { value: 'dinner',   label: 'Diner',     Icon: MoonIcon,    color: '#5a9e87' },
  { value: 'snack',    label: 'Collation',  Icon: AppleIcon,   color: '#c9a88c' },
];

const QUANTITY_PRESETS = [50, 100, 150, 200, 250, 300];

export default function QuickAddFromScan({ product, selectedDate, onSubmit, onClose }) {
  const [mealType, setMealType] = useState('lunch');
  const [date, setDate] = useState(selectedDate);
  const [quantity, setQuantity] = useState('100');
  const [submitting, setSubmitting] = useState(false);

  const per100 = product?.nutrition || {};
  const grams = Number(quantity) || 0;

  const computed = useMemo(() => {
    const ratio = grams / 100;
    return {
      calories: Math.round((per100.calories || 0) * ratio),
      proteins: Math.round((per100.proteins || 0) * ratio * 10) / 10,
      carbs: Math.round((per100.carbs || 0) * ratio * 10) / 10,
      fats: Math.round((per100.fats || 0) * ratio * 10) / 10,
      fiber: Math.round((per100.fiber || 0) * ratio * 10) / 10,
    };
  }, [per100, grams]);

  if (!product) return null;

  const productName = product.name + (product.brand ? ` - ${product.brand}` : '');

  const handleSubmit = async () => {
    if (grams <= 0 || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: `${productName} (${grams}g)`,
        mealType,
        date,
        nutrition: computed,
      });
      onClose();
    } catch {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className={style.modalOverlay} onClick={onClose}>
      <div className={style.modal} onClick={(e) => e.stopPropagation()}>
        <div className={style.modalHeader}>
          <h3>Ajouter aux repas</h3>
          <button onClick={onClose} className={style.modalClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={style.modalForm}>
          {/* Product info */}
          <div className={style.scannedProduct}>
            {product.imageUrl && (
              <img src={product.imageUrl} alt="" className={style.scannedProductImg} />
            )}
            <div className={style.scannedProductInfo}>
              <span className={style.scannedProductName}>{productName}</span>
              {product.quantity && (
                <span className={style.scannedProductSize}>Conditionnement : {product.quantity}</span>
              )}
              <div className={style.scannedProductPer100}>
                <span>{per100.calories || 0} kcal</span>
                <span>{per100.proteins || 0}g prot</span>
                <span>{per100.carbs || 0}g gluc</span>
                <span>{per100.fats || 0}g lip</span>
              </div>
              <span className={style.scannedProductHint}>Valeurs pour 100g</span>
            </div>
          </div>

          {/* Date */}
          <div className={style.formGroup}>
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
          </div>

          {/* Meal type — visual buttons */}
          <div className={style.formGroup}>
            <label>Repas</label>
            <div className={style.quickMealPicker}>
              {MEAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`${style.quickMealBtn} ${mealType === opt.value ? style.quickMealBtnActive : ''}`}
                  style={mealType === opt.value ? { borderColor: opt.color, color: opt.color } : undefined}
                  onClick={() => setMealType(opt.value)}
                >
                  <opt.Icon size={16} />
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className={style.quantityField}>
            <label>Quantite consommee</label>
            <div className={style.quantityInput}>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1" max="5000" step="1"
              />
              <span className={style.quantityUnit}>g</span>
            </div>
            <div className={style.quantityPresets}>
              {QUANTITY_PRESETS.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`${style.quantityPreset} ${String(g) === quantity ? style.quantityPresetActive : ''}`}
                  onClick={() => setQuantity(String(g))}
                >
                  {g}g
                </button>
              ))}
            </div>
          </div>

          {/* Computed nutrition preview */}
          <div className={style.quickNutritionPreview}>
            <span>{computed.calories} kcal</span>
            <span>{computed.proteins}g P</span>
            <span>{computed.carbs}g G</span>
            <span>{computed.fats}g L</span>
          </div>

          {/* Submit */}
          <button
            className={style.btnPrimary}
            onClick={handleSubmit}
            disabled={grams <= 0 || submitting}
            style={{ width: '100%', opacity: grams <= 0 ? 0.5 : 1 }}
          >
            {submitting ? 'Ajout...' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
