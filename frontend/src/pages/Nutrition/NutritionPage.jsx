import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import usePageTitle from '../../hooks/usePageTitle';
import { storage } from '../../shared/utils/storage';
import { getSubscriptionStatus } from '../../shared/api/subscription';

import DateSelector from './components/DateSelector';
import DailySummaryCard from './components/DailySummaryCard';
import MacroBreakdown from './components/MacroBreakdown';
import CalorieBalanceChart from './components/CalorieBalanceChart';
import MealList from './components/MealList';
import ManualFoodForm from './components/ManualFoodForm';
import WeeklyNutritionChart from './components/WeeklyNutritionChart';
import NutritionGoalSetup from './components/NutritionGoalSetup';

import { useNutritionData } from './hooks/useNutritionData';
import { useNutritionGoals } from './hooks/useNutritionGoals';
import { useFoodLog } from './hooks/useFoodLog';

import style from './NutritionPage.module.css';

export default function NutritionPage() {
  usePageTitle('Suivi Nutritionnel');
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isPremium, setIsPremium] = useState(false);
  const [showFoodForm, setShowFoodForm] = useState(false);
  const [showGoalSetup, setShowGoalSetup] = useState(false);
  const [defaultMealType, setDefaultMealType] = useState('lunch');
  const [editEntry, setEditEntry] = useState(null);

  useEffect(() => {
    const user = storage.get('user');
    if (!user) {
      navigate('/');
      return;
    }
    getSubscriptionStatus()
      .then((s) => setIsPremium(s.tier === 'premium'))
      .catch(() => setIsPremium(false));
  }, [navigate]);

  const { dailySummary, weeklySummary, loading, refresh } = useNutritionData(selectedDate, isPremium);
  const { goals, saveGoals } = useNutritionGoals();

  const { addManual, update, remove, submitting } = useFoodLog(refresh);

  const handleAddClick = useCallback((mealType) => {
    setDefaultMealType(mealType);
    setEditEntry(null);
    setShowFoodForm(true);
  }, []);

  const handleEditClick = useCallback((entry) => {
    setEditEntry(entry);
    setShowFoodForm(true);
  }, []);

  const handleDeleteClick = useCallback(async (id) => {
    try {
      await remove(id);
      toast.success('Entrée supprimée');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  }, [remove]);

  const handleFormSubmit = useCallback(async (data, editId) => {
    try {
      if (editId) {
        await update(editId, data);
        toast.success('Entrée modifiée');
      } else {
        await addManual(data);
        toast.success('Aliment ajouté');
      }
      setShowFoodForm(false);
      setEditEntry(null);
    } catch (err) {
      if (err.response?.data?.error === 'free_limit_reached') {
        toast.error(err.response.data.message);
      } else {
        toast.error('Erreur lors de l\'enregistrement');
      }
    }
  }, [addManual, update]);

  const handleSaveGoals = useCallback(async (data) => {
    try {
      await saveGoals(data);
      toast.success('Objectifs enregistrés');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    }
  }, [saveGoals]);

  const consumed = dailySummary?.consumed?.calories || 0;
  const burned = dailySummary?.burned || 0;
  const goalCalories = goals?.dailyCalories || 2000;
  const entries = dailySummary?.entries || [];

  return (
    <>
      <Header />
      <main className={style.page}>
        <div className={style.container}>
          <header className={style.pageHeader}>
            <h1 className={style.pageTitle}>Suivi Nutritionnel</h1>
            <button onClick={() => setShowGoalSetup(true)} className={style.goalBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Objectifs
            </button>
          </header>

          <DateSelector selectedDate={selectedDate} onChange={setSelectedDate} />

          {loading ? (
            <div className={style.loading}>Chargement...</div>
          ) : (
            <>
              <div className={style.grid}>
                <DailySummaryCard consumed={consumed} goal={goalCalories} burned={burned} />
                <MacroBreakdown
                  proteins={dailySummary?.consumed?.proteins || 0}
                  carbs={dailySummary?.consumed?.carbs || 0}
                  fats={dailySummary?.consumed?.fats || 0}
                  goalsProteins={goals?.macros?.proteins || 150}
                  goalsCarbs={goals?.macros?.carbs || 250}
                  goalsFats={goals?.macros?.fats || 65}
                  isPremium={isPremium}
                />
              </div>

              <CalorieBalanceChart consumed={consumed} burned={burned} goal={goalCalories} />

              <MealList
                entries={entries}
                onAdd={handleAddClick}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
              />

              <WeeklyNutritionChart data={weeklySummary} isPremium={isPremium} />
            </>
          )}
        </div>
      </main>
      <Footer />

      <ManualFoodForm
        isOpen={showFoodForm}
        onClose={() => { setShowFoodForm(false); setEditEntry(null); }}
        onSubmit={handleFormSubmit}
        defaultMealType={defaultMealType}
        editEntry={editEntry}
        selectedDate={selectedDate}
      />

      <NutritionGoalSetup
        isOpen={showGoalSetup}
        onClose={() => setShowGoalSetup(false)}
        onSave={handleSaveGoals}
        currentGoals={goals}
      />
    </>
  );
}
