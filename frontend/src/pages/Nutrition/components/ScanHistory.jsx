import { useState, useEffect } from 'react';
import client from '../../../shared/api/client';
import { CameraIcon, SearchIcon } from './NutritionIcons';
import style from '../NutritionPage.module.css';

const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function ScanHistory({ onUseProduct, refreshSignal }) {
  const [tab, setTab] = useState('plats');
  const [plats, setPlats] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      client.get('/nutrition/scans/plats').then(r => setPlats(r.data.plats || [])).catch(() => {}),
      client.get('/nutrition/scans/ingredients').then(r => setIngredients(r.data.ingredients || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [refreshSignal]);

  const handleDelete = async (type, id) => {
    try {
      await client.delete(`/nutrition/scans/${type}/${id}`);
      if (type === 'plats') setPlats(prev => prev.filter(p => p._id !== id));
      else setIngredients(prev => prev.filter(p => p._id !== id));
    } catch { /* silent */ }
  };

  const handleUse = (item, type) => {
    if (!onUseProduct) return;
    if (type === 'plats') {
      onUseProduct({
        name: item.name,
        brand: null,
        quantity: item.portionDescription || `${item.portionG || 100}g`,
        imageUrl: item.imageUrl,
        nutrition: item.nutrition,
        defaultPortionG: item.portionG || 100,
        source: 'scan_history',
      });
    } else {
      onUseProduct({
        name: item.name,
        brand: item.brand,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
        nutrition: item.nutritionPer100g,
        source: 'scan_history',
      });
    }
  };

  const items = tab === 'plats' ? plats : ingredients;
  const isEmpty = items.length === 0;

  return (
    <div className={style.scanSection}>
      <div className={style.scanHeader}>
        <h3 className={style.cardTitle}>Mes Scans</h3>
        <div className={style.scanTabs}>
          <button
            className={`${style.scanTab} ${tab === 'plats' ? style.scanTabActive : ''}`}
            onClick={() => setTab('plats')}
          >
            Plats ({plats.length})
          </button>
          <button
            className={`${style.scanTab} ${tab === 'ingredients' ? style.scanTabActive : ''}`}
            onClick={() => setTab('ingredients')}
          >
            Ingrédients ({ingredients.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className={style.scanEmpty}>Chargement...</div>
      ) : isEmpty ? (
        <div className={style.scanEmpty}>
          <span className={style.scanEmptyIcon}>
            {tab === 'plats' ? <CameraIcon size={28} /> : <SearchIcon size={28} />}
          </span>
          <span>Aucun {tab === 'plats' ? 'plat scanné' : 'ingrédient scanné'}</span>
          <span className={style.scanEmptyHint}>
            {tab === 'plats'
              ? 'Prends en photo un plat via le chat IA ou le scanner'
              : 'Scanne un code-barres pour ajouter un ingrédient'}
          </span>
        </div>
      ) : (
        <div className={style.scanList}>
          {items.map(item => {
            const n = tab === 'plats' ? item.nutrition : item.nutritionPer100g;
            return (
              <div key={item._id} className={style.scanItem}>
                {item.imageUrl && (
                  <img src={item.imageUrl} alt="" className={style.scanItemImg} />
                )}
                {!item.imageUrl && (
                  <div className={style.scanItemInitial}>
                    {item.name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div className={style.scanItemInfo}>
                  <span className={style.scanItemName}>{item.name}</span>
                  {item.brand && <span className={style.scanItemBrand}>{item.brand}</span>}
                  <span className={style.scanItemMacros}>
                    {n?.calories || 0}kcal · {n?.proteins || 0}g P · {n?.carbs || 0}g G · {n?.fats || 0}g L
                  </span>
                  <span className={style.scanItemDate}>{formatDate(item.createdAt)}</span>
                </div>
                <div className={style.scanItemActions}>
                  <button
                    className={style.scanItemUse}
                    onClick={() => handleUse(item, tab)}
                    title="Utiliser"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                  </button>
                  <button
                    className={style.scanItemDelete}
                    onClick={() => handleDelete(tab, item._id)}
                    title="Supprimer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
