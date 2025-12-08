import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import ProgramBrowser from '../../components/Programs/ProgramBrowser/ProgramBrowser';
import ProgramPreview from '../../components/Programs/ProgramPreview/ProgramPreview';
import ProgramRunner from '../../components/Programs/ProgramRunner/ProgramRunner';
import ProgramForm from '../../components/Programs/ProgramForm/ProgramForm';
import MyPrograms from '../../components/Programs/MyPrograms/MyPrograms';
import { secureApiCall, isAuthenticated } from '../../utils/authService';
import { getSubscriptionStatus } from '../../shared/api/subscription';
import logger from '../../shared/utils/logger';
import { retryApiCall, saveToLocalStorage } from '../../utils/apiRetry';
import styles from './Programs.module.css';

export default function Programs() {
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [viewMode, setViewMode] = useState('browse'); // 'browse', 'preview', 'running', 'create', 'my-programs'
  const [isPremium, setIsPremium] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'saved', 'error', 'not_saved'
  const [editingProgram, setEditingProgram] = useState(null);

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
        // Utiliser retryApiCall avec exponential backoff
        await retryApiCall(
          async () => {
            // Utiliser la nouvelle route record-completion qui crée directement une session terminée
            const response = await secureApiCall('/programs/' + result.programId + '/record-completion', {
              method: 'POST',
              body: JSON.stringify({
                cyclesCompleted: result.cyclesCompleted,
                durationSec: result.durationSec,
                calories: result.estimatedCalories,
                entries: [] // Optionnel : détails des cycles si disponibles
              }),
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }

            const { session } = await response.json();
            logger.info('Session enregistrée:', session);

            return { success: true };
          },
          {
            maxRetries: 3,
            delayMs: 1000,
            onRetry: (attempt, max) => {
              logger.info(`Tentative ${attempt}/${max} de sauvegarde...`);
            },
          }
        );

        logger.info('Session sauvegardée avec succès');
        setSaveStatus('saved');
      } catch (error) {
        logger.error('Erreur lors de la sauvegarde après plusieurs tentatives:', error);

        // Sauvegarder en localStorage en fallback
        if (isPremium && isAuthenticated()) {
          saveToLocalStorage('pending_program_sessions', {
            programId: result.programId,
            programName: result.programName,
            cyclesCompleted: result.cyclesCompleted,
            durationSec: result.durationSec,
            calories: result.estimatedCalories,
          });
          logger.info('Session sauvegardée localement pour synchronisation ultérieure');
          setSaveStatus('saved_locally');
        } else {
          setSaveStatus('error');
        }
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
    setEditingProgram(null);
    setSelectedProgram(null);
    setSaveStatus(null);
  };

  const handleSaveProgram = async (programData) => {
    console.log('🚀 handleSaveProgram appelé avec:', programData);
    console.log('📊 Nombre de cycles:', programData.cycles?.length || 0);

    try {
      const endpoint = editingProgram
        ? `/api/programs/${editingProgram._id}`
        : '/api/programs';

      const method = editingProgram ? 'PATCH' : 'POST';

      console.log(`🌐 Requête ${method} vers ${endpoint}`);
      console.log('📤 Données envoyées:', JSON.stringify(programData, null, 2));

      const response = await secureApiCall(endpoint, {
        method,
        body: JSON.stringify(programData),
      });

      console.log('📥 Réponse reçue - Status:', response.status, 'OK:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Programme sauvegardé avec succès:', data);
        logger.info('Programme sauvegardé avec succès');
        alert('✅ Programme créé avec succès !');
        setViewMode('my-programs');
        setEditingProgram(null);
      } else {
        const error = await response.json();
        console.error('❌ Erreur serveur:', error);
        logger.error('Erreur sauvegarde programme:', error);
        alert('❌ Erreur: ' + (error.error || 'Erreur inconnue'));
      }
    } catch (error) {
      console.error('💥 Exception:', error);
      logger.error('Erreur sauvegarde programme:', error);
      alert('❌ Erreur lors de la sauvegarde: ' + error.message);
    }
  };

  const handleViewMyPrograms = () => {
    setViewMode('my-programs');
  };

  const handleEditProgram = (program) => {
    setEditingProgram(program);
    setViewMode('create');
  };

  return (
    <>
      <Navbar />
      <div className={styles.page}>
        <div className={styles.container}>
          {viewMode === 'browse' && (
            <ProgramBrowser
              onSelectProgram={handleSelectProgram}
              onCreateProgram={handleCreateProgram}
              onViewMyPrograms={handleViewMyPrograms}
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
            <ProgramForm
              onSave={handleSaveProgram}
              onCancel={handleBackToBrowse}
              initialData={editingProgram}
              isAdmin={false}
            />
          )}

          {viewMode === 'my-programs' && (
            <MyPrograms
              onBack={handleBackToBrowse}
              onEdit={handleEditProgram}
              onSelectProgram={handleSelectProgram}
            />
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
