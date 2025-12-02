import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import NavBar from '../../components/NavBar/NavBar';
import Footer from '../../components/Footer/Footer';
import ProgramBrowser from '../../components/Programs/ProgramBrowser/ProgramBrowser';
import ProgramPreview from '../../components/Programs/ProgramPreview/ProgramPreview';
import ProgramRunner from '../../components/Programs/ProgramRunner/ProgramRunner';
import { storage } from '../../shared/utils/storage';
import { secureApiCall, isAuthenticated } from '../../utils/authService';
import { getSubscriptionStatus } from '../../shared/api/subscription';
import logger from '../../shared/utils/logger';
import styles from './Programs.module.css';

export default function Programs() {
  const { t } = useTranslation();
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [viewMode, setViewMode] = useState('browse'); // 'browse', 'preview', 'running', 'create'
  const [isPremium, setIsPremium] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'saved', 'error', 'not_saved'

  // Vérifier si l'utilisateur est Premium au chargement
  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        if (!isAuthenticated()) {
          setIsPremium(false);
          return;
        }

        const subscriptionData = await getSubscriptionStatus();
        setIsPremium(subscriptionData.tier === 'premium');
      } catch (error) {
        logger.error('Erreur lors de la vérification Premium:', error);
        setIsPremium(false);
      }
    };

    checkPremiumStatus();
  }, []);

  const handleSelectProgram = (program) => {
    setSelectedProgram(program);
    setViewMode('preview');
    setSaveStatus(null);
  };

  const handleStartProgram = () => {
    setViewMode('running');
  };

  const handleBackToBrowse = () => {
    setSelectedProgram(null);
    setViewMode('browse');
    setSaveStatus(null);
  };

  const handleComplete = async (result) => {
    logger.info('Programme terminé:', result);

    // Vérifier si l'ID est un ObjectId MongoDB valide (24 caractères hexadécimaux)
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(result.programId);

    // Essayer de sauvegarder la session (si connecté, Premium et programme MongoDB)
    if (isMongoId) {
      setSaveStatus('saving');
      try {
        const response = await secureApiCall('/programs/' + result.programId + '/start', {
          method: 'POST',
        });

        if (response.ok) {
          const { session } = await response.json();
          logger.info('Session créée:', session);

          // Compléter la session
          await secureApiCall('/programs/session/' + session._id + '/complete', {
            method: 'PATCH',
            body: JSON.stringify({
              cyclesCompleted: result.cyclesCompleted,
              durationSec: result.durationSec,
              calories: result.estimatedCalories,
            }),
          });

          logger.info('Session sauvegardée avec succès');
          setSaveStatus('saved');
        } else {
          // Non connecté ou non Premium - pas de sauvegarde
          logger.info('Session non sauvegardée (non connecté ou non Premium)');
          setSaveStatus('not_saved');
        }
      } catch (error) {
        logger.error('Erreur lors de la sauvegarde:', error);
        setSaveStatus('error');
      }
    } else {
      // Programme JSON - pas de sauvegarde backend
      logger.info('Programme JSON - pas de sauvegarde backend');
      setSaveStatus('not_saved');
    }
  };

  const handleCancel = () => {
    setViewMode('browse');
    setSelectedProgram(null);
    setSaveStatus(null);
  };

  const handleBackToList = () => {
    setViewMode('browse');
    setSelectedProgram(null);
    setSaveStatus(null);
  };

  const handleCreateProgram = () => {
    setViewMode('create');
    setSelectedProgram(null);
    setSaveStatus(null);
  };

  return (
    <>
      <NavBar />
      <div className={styles.page}>
        <div className={styles.container}>
          {viewMode === 'browse' && (
            <ProgramBrowser
              onSelectProgram={handleSelectProgram}
              onCreateProgram={handleCreateProgram}
              isPremium={isPremium}
            />
          )}

          {viewMode === 'preview' && selectedProgram && (
            <ProgramPreview
              program={selectedProgram}
              onStart={handleStartProgram}
              onBack={handleBackToBrowse}
            />
          )}

          {viewMode === 'running' && selectedProgram && (
            <ProgramRunner
              program={selectedProgram}
              onComplete={handleComplete}
              onCancel={handleCancel}
              onBackToList={handleBackToList}
              isPremium={isPremium}
              saveStatus={saveStatus}
            />
          )}

          {viewMode === 'create' && (
            <div className={styles.createView}>
              <div className={styles.createHeader}>
                <h2>Créer un programme personnalisé</h2>
                <p>Cette fonctionnalité arrive bientôt pour les utilisateurs Premium !</p>
              </div>
              <button onClick={handleBackToBrowse} className={styles.backButton}>
                Retour aux programmes
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
