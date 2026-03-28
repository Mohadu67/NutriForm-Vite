import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import style from '../NutritionPage.module.css';
import BarcodeScanner from '../../../components/BarcodeScanner/BarcodeScanner';

const MEAL_OPTIONS = [
  { value: 'breakfast', label: 'Petit-déjeuner' },
  { value: 'lunch', label: 'Déjeuner' },
  { value: 'dinner', label: 'Dîner' },
  { value: 'snack', label: 'Collation' },
];

export default function ManualFoodForm({ isOpen, onClose, onSubmit, defaultMealType, editEntry, selectedDate }) {
  const [name, setName] = useState('');
  const [mealType, setMealType] = useState('lunch');
  const [calories, setCalories] = useState('');
  const [proteins, setProteins] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [fiber, setFiber] = useState('');
  const [notes, setNotes] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    if (editEntry) {
      setName(editEntry.name || '');
      setMealType(editEntry.mealType || 'lunch');
      setCalories(String(editEntry.nutrition?.calories || ''));
      setProteins(String(editEntry.nutrition?.proteins || ''));
      setCarbs(String(editEntry.nutrition?.carbs || ''));
      setFats(String(editEntry.nutrition?.fats || ''));
      setFiber(String(editEntry.nutrition?.fiber || ''));
      setNotes(editEntry.notes || '');
    } else {
      setName('');
      setMealType(defaultMealType || 'lunch');
      setCalories('');
      setProteins('');
      setCarbs('');
      setFats('');
      setFiber('');
      setNotes('');
    }
  }, [editEntry, defaultMealType, isOpen]);

  const handleProductFound = (product) => {
    setName(product.name + (product.brand ? ` – ${product.brand}` : '') + ' (100g)');
    setCalories(String(product.nutrition.calories));
    setProteins(String(product.nutrition.proteins));
    setCarbs(String(product.nutrition.carbs));
    setFats(String(product.nutrition.fats));
    setFiber(String(product.nutrition.fiber));
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !calories) return;

    onSubmit({
      name: name.trim(),
      mealType,
      date: selectedDate,
      nutrition: {
        calories: Number(calories),
        proteins: Number(proteins) || 0,
        carbs: Number(carbs) || 0,
        fats: Number(fats) || 0,
        fiber: Number(fiber) || 0,
      },
      notes: notes.trim() || undefined,
    }, editEntry?._id);
  };

  return createPortal(
    <>
    <BarcodeScanner
      isOpen={scannerOpen}
      onClose={() => setScannerOpen(false)}
      onProductFound={handleProductFound}
    />
    <div className={style.modalOverlay} onClick={onClose}>
      <div className={style.modal} onClick={(e) => e.stopPropagation()}>
        <div className={style.modalHeader}>
          <h3>{editEntry ? 'Modifier l\'entrée' : 'Ajouter un aliment'}</h3>
          {!editEntry && (
            <button type="button" onClick={() => setScannerOpen(true)} className={style.scanBtn} title="Scanner un code-barres">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 5H1v4h2V5zm0 10H1v4h2v-4zm18-10h2v4h-2V5zm0 10h2v4h-2v-4zM7 4h1v16H7zm3 0h1v16h-1zm4 0h2v16h-2z"/>
              </svg>
              Scanner
            </button>
          )}
          <button onClick={onClose} className={style.modalClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className={style.modalForm}>
          <div className={style.formGroup}>
            <label>Nom de l'aliment *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Poulet grillé" required maxLength={200} />
          </div>
          <div className={style.formGroup}>
            <label>Type de repas</label>
            <select value={mealType} onChange={(e) => setMealType(e.target.value)}>
              {MEAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className={style.formRow}>
            <div className={style.formGroup}>
              <label>Calories (kcal) *</label>
              <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} min="0" required />
            </div>
            <div className={style.formGroup}>
              <label>Protéines (g)</label>
              <input type="number" value={proteins} onChange={(e) => setProteins(e.target.value)} min="0" />
            </div>
          </div>
          <div className={style.formRow}>
            <div className={style.formGroup}>
              <label>Glucides (g)</label>
              <input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} min="0" />
            </div>
            <div className={style.formGroup}>
              <label>Lipides (g)</label>
              <input type="number" value={fats} onChange={(e) => setFats(e.target.value)} min="0" />
            </div>
          </div>
          <div className={style.formGroup}>
            <label>Fibres (g)</label>
            <input type="number" value={fiber} onChange={(e) => setFiber(e.target.value)} min="0" />
          </div>
          <div className={style.formGroup}>
            <label>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes optionnelles..." maxLength={300} rows={2} />
          </div>
          <div className={style.modalActions}>
            <button type="button" onClick={onClose} className={style.btnSecondary}>Annuler</button>
            <button type="submit" className={style.btnPrimary}>
              {editEntry ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>,
    document.body
  );
}
