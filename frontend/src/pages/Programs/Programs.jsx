import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification.jsx';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import ProgramBrowser from '../../components/Programs/ProgramBrowser/ProgramBrowser';
import ProgramPreview from '../../components/Programs/ProgramPreview/ProgramPreview';
import ProgramRunner from '../../components/Programs/ProgramRunner/ProgramRunner';
import ProgramForm from '../../components/Programs/ProgramForm/ProgramForm';
import MyPrograms from '../../components/Programs/MyPrograms/MyPrograms';
import { secureApiCall, isAuthenticated } from '../../utils/authService';
import { getSubscriptionStatus } from '../../shared/api/subscription';
import { getActiveSession, clearActiveSession, getSessionSummary } from '../../utils/programSession';
import logger from '../../shared/utils/logger';
import { retryApiCall, saveToLocalStorage } from '../../utils/apiRetry';
import styles from './Programs.module.css';

export default function Programs() {
  const notify = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [viewMode, setViewMode] = useState('browse'); // 'browse', 'preview', 'running', 'create', 'my-programs'
  const [isPremium, setIsPremium] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'saved', 'error', 'not_saved'
  const [editingProgram, setEditingProgram] = useState(null);
  const [myProgramsRefreshKey, setMyProgramsRefreshKey] = useState(0);
  const [activeSession, setActiveSession] = useState(null);
  const [sessionSummary, setSessionSummary] = useState(null);

  // Vérifier si on vient de la page admin
  const fromAdmin = location.state?.fromAdmin || false;

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

    // Vérifier si une session active existe
    const session = getActiveSession();
    if (session) {
      setActiveSession(session);
      setSessionSummary(getSessionSummary());
      logger.info('💪 Session active détectée');
    }
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
    clearActiveSession();
    setActiveSession(null);
    setSessionSummary(null);
    setViewMode('browse');
    setSelectedProgram(null);
    setSaveStatus(null);
  };

  const handleBackToList = () => {
    setViewMode('browse');
    setSelectedProgram(null);
    setSaveStatus(null);
  };

  const handleResumeSession = () => {
    if (activeSession) {
      setSelectedProgram(activeSession.program);
      setViewMode('running');
    }
  };

  const handleAbandonSession = () => {
    clearActiveSession();
    setActiveSession(null);
    setSessionSummary(null);
    notify.info('Session abandonnée');
  };

  const handleCreateProgram = () => {
    setViewMode('create');
    setEditingProgram(null);
    setSelectedProgram(null);
    setSaveStatus(null);
  };

  const handleSaveProgram = async (programData) => {
    logger.debug('handleSaveProgram appelé avec:', programData);
    logger.debug('Nombre de cycles:', programData.cycles?.length || 0);

    try {
      const endpoint = editingProgram
        ? `/programs/${editingProgram._id}`
        : '/programs';

      const method = editingProgram ? 'PATCH' : 'POST';

      logger.debug(`Requête ${method} vers ${endpoint}`);

      const response = await secureApiCall(endpoint, {
        method,
        body: JSON.stringify(programData),
      });

      logger.debug('Réponse reçue - Status:', response.status, 'OK:', response.ok);

      if (response.ok) {
        const data = await response.json();
        logger.info('Programme sauvegardé avec succès');
        notify.success('Programme créé avec succès !');
        setMyProgramsRefreshKey(prev => prev + 1); // Forcer le rechargement de MyPrograms
        setViewMode('my-programs');
        setEditingProgram(null);
      } else {
        const error = await response.json();
        logger.error('Erreur serveur:', error);
        notify.error('Erreur: ' + (error.error || 'Erreur inconnue'));
      }
    } catch (error) {
      logger.error('Exception lors de la sauvegarde:', error);
      notify.error('Erreur lors de la sauvegarde: ' + error.message);
    }
  };

  const handleViewMyPrograms = () => {
    setViewMode('my-programs');
  };

  const handleEditProgram = (program) => {
    setEditingProgram(program);
    setViewMode('create');
  };

  const handleViewProgram = (program) => {
    // Ouvrir le programme dans un nouvel onglet
    if (program._id) {
      window.open(`/programs/${program._id}`, '_blank');
    }
  };

  return (
    <>
      <Navbar />
      <div className={styles.page}>
        <div className={styles.container}>
          {/* Bouton retour si on vient de l'admin */}
          {fromAdmin && viewMode === 'browse' && (
            <button
              onClick={() => navigate(-1)}
              className={styles.backToAdminBtn}
              aria-label="Retour à la page admin"
            >
              ← Retour à l'administration
            </button>
          )}

          {/* Banner pour reprendre la session */}
          {sessionSummary && viewMode !== 'running' && (
            <div className={styles.resumeSessionBanner}>
              <div className={styles.resumeSessionContent}>
                <div className={styles.resumeSessionIcon}>💪</div>
                <div className={styles.resumeSessionInfo}>
                  <h3>Séance en cours</h3>
                  <p>
                    {sessionSummary.programName} - {sessionSummary.currentCycleName}
                  </p>
                  <div className={styles.resumeSessionProgress}>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${sessionSummary.progress}%` }}
                      ></div>
                    </div>
                    <span>{sessionSummary.progress}% complété</span>
                  </div>
                </div>
                <div className={styles.resumeSessionActions}>
                  <button onClick={handleResumeSession} className={styles.resumeBtn}>
                    Reprendre
                  </button>
                  <button onClick={handleAbandonSession} className={styles.abandonBtn}>
                    Abandonner
                  </button>
                </div>
              </div>
            </div>
          )}

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
              initialState={activeSession}
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
              onView={handleViewProgram}
              refreshKey={myProgramsRefreshKey}
            />
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
