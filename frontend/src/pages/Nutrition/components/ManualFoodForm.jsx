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

  // Scanned product data (per 100g) + user quantity
  const [scannedProduct, setScannedProduct] = useState(null);
  const [quantity, setQuantity] = useState('100');

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
      setScannedProduct(null);
      setQuantity('100');
    }
  }, [editEntry, defaultMealType, isOpen]);

  const handleProductFound = (product) => {
    // Store raw per-100g values, let user pick quantity
    setScannedProduct({
      name: product.name + (product.brand ? ` – ${product.brand}` : ''),
      imageUrl: product.imageUrl,
      productQuantity: product.quantity, // e.g. "300g"
      per100: { ...product.nutrition },
    });
    setQuantity('100');
    applyQuantity(product.nutrition, 100, product.name + (product.brand ? ` – ${product.brand}` : ''));
  };

  const applyQuantity = (per100, grams, productName) => {
    const ratio = grams / 100;
    setName(`${productName || scannedProduct?.name || ''} (${grams}g)`);
    setCalories(String(Math.round(per100.calories * ratio)));
    setProteins(String(Math.round(per100.proteins * ratio * 10) / 10));
    setCarbs(String(Math.round(per100.carbs * ratio * 10) / 10));
    setFats(String(Math.round(per100.fats * ratio * 10) / 10));
    setFiber(String(Math.round((per100.fiber || 0) * ratio * 10) / 10));
  };

  const handleQuantityChange = (val) => {
    setQuantity(val);
    const grams = Number(val) || 0;
    if (scannedProduct?.per100 && grams > 0) {
      applyQuantity(scannedProduct.per100, grams, scannedProduct.name);
    }
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
          {/* Scanned product — quantity selector */}
          {scannedProduct && (
            <div className={style.scannedProduct}>
              {scannedProduct.imageUrl && (
                <img src={scannedProduct.imageUrl} alt="" className={style.scannedProductImg} />
              )}
              <div className={style.scannedProductInfo}>
                <span className={style.scannedProductName}>{scannedProduct.name}</span>
                {scannedProduct.productQuantity && (
                  <span className={style.scannedProductSize}>Conditionnement : {scannedProduct.productQuantity}</span>
                )}
                <div className={style.scannedProductPer100}>
                  <span>{scannedProduct.per100.calories} kcal</span>
                  <span>{scannedProduct.per100.proteins}g prot</span>
                  <span>{scannedProduct.per100.carbs}g gluc</span>
                  <span>{scannedProduct.per100.fats}g lip</span>
                </div>
                <span className={style.scannedProductHint}>Valeurs pour 100g</span>
              </div>
              <div className={style.quantityField}>
                <label>Quantité consommée</label>
                <div className={style.quantityInput}>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    min="1"
                    max="5000"
                    step="1"
                  />
                  <span className={style.quantityUnit}>g</span>
                </div>
                <div className={style.quantityPresets}>
                  {[50, 100, 150, 200, 250, 300].map(g => (
                    <button
                      key={g}
                      type="button"
                      className={`${style.quantityPreset} ${String(g) === quantity ? style.quantityPresetActive : ''}`}
                      onClick={() => handleQuantityChange(String(g))}
                    >
                      {g}g
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

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
