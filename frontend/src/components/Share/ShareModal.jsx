import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaWhatsapp, FaFacebook, FaTwitter, FaDownload, FaLink, FaTimes, FaCheckCircle, FaEnvelope } from 'react-icons/fa';
import html2canvas from 'html2canvas';
import Avatar from '../Shared/Avatar';
import { formatDisplayName } from '../../shared/utils/string';
import ShareSessionCard from './ShareSessionCard';
import styles from './ShareModal.module.css';
import logger from '../../shared/utils/logger.js';
import { getConversations, shareSession } from '../../shared/api/matchChat';

const ShareModal = ({ show, onHide, session, user }) => {
  const [generating, setGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showConversations, setShowConversations] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [sendingToConversation, setSendingToConversation] = useState(null);

  // Confetti effect quand on partage
  useEffect(() => {
    if (show) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  // Bloquer le scroll du body quand le modal est ouvert
  useEffect(() => {
    if (show) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [show]);

  // Fermer le modal avec Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && show) {
        onHide();
      }
    };

    if (show) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [show, onHide]);

  const generateImage = async () => {
    setGenerating(true);
    setError(null);

    try {
      // Attendre que le modal soit complètement rendu
      await new Promise(resolve => setTimeout(resolve, 400));

      const cardElement = document.querySelector('[data-share-card]');
      if (!cardElement) {
        throw new Error('Impossible de trouver la carte à partager');
      }

      const canvas = await html2canvas(cardElement, {
        backgroundColor: '#ffffff',
        scale: 3, // Haute qualité
        logging: false,
        useCORS: true,
        allowTaint: true,
        windowWidth: cardElement.scrollWidth,
        windowHeight: cardElement.scrollHeight,
      });

      return canvas;
    } catch (error) {
      logger.error('Erreur lors de la génération de l\'image:', error);
      throw error;
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    try {
      const canvas = await generateImage();
      if (!canvas) throw new Error('Échec de la génération de l\'image');

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        link.download = `harmonith-${session.name || 'seance'}-${date}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);

        // Success feedback
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }, 'image/png', 1.0);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors du téléchargement');
    }
  };

  const handleShare = async (platform) => {
    try {
      const canvas = await generateImage();
      if (!canvas) throw new Error('Échec de la génération de l\'image');

      canvas.toBlob(async (blob) => {
        const file = new File([blob], 'harmonith-session.png', { type: 'image/png' });

        // Native sharing si disponible
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'Ma séance de sport',
              text: `J'ai terminé ma séance "${session.name || 'Séance'}" sur Harmonith ! 💪\n⏱️ ${Math.floor((session.durationSec || 0) / 60)} min | 🔥 ${session.calories || 0} kcal`,
            });

            // Success feedback
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
            return;
          } catch (error) {
            if (error.name === 'AbortError') return; // User cancelled
          }
        }

        // Fallback vers partage web
        fallbackShare(platform, blob);
      }, 'image/png', 1.0);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors du partage');
    }
  };

  const fallbackShare = (platform) => {
    const text = encodeURIComponent(`J'ai terminé ma séance "${session.name || 'Séance'}" sur Harmonith ! 💪\n\n⏱️ ${Math.floor((session.durationSec || 0) / 60)} min | 🔥 ${session.calories || 0} kcal\n\n✨ Rejoins-moi sur Harmonith`);
    const url = encodeURIComponent('https://harmonith.fr/leaderboard');

    let shareUrl = '';

    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${text}%0A%0A${url}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=Harmonith,Fitness,Workout`;
        break;
      default:
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=600');

      // Success feedback
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    const shareText = `🎉 J'ai terminé ma séance "${session.name || 'Séance de sport'}" sur Harmonith !

📊 Résultats :
⏱️ Durée : ${Math.floor((session.durationSec || 0) / 60)} min
🔥 Calories : ${session.calories || 0} kcal
💪 Exercices : ${session.entries?.length || 0}

✨ Rejoins-moi sur Harmonith : https://harmonith.fr/leaderboard`;

    try {
      await navigator.clipboard.writeText(shareText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      setError('Impossible de copier le texte');
    }
  };

  const handleShareToChat = async () => {
    try {
      setLoadingConversations(true);
      setError(null);

      // Charger les conversations
      const response = await getConversations();
      setConversations(response.conversations || []);

      if (response.conversations?.length === 0) {
        setError('Aucune conversation disponible. Commence par matcher avec quelqu\'un !');
        setLoadingConversations(false);
        return;
      }

      // Afficher le sélecteur de conversations
      setShowConversations(true);
      setLoadingConversations(false);
    } catch (err) {
      logger.error('Erreur chargement conversations:', err);
      setError('Impossible de charger les conversations');
      setLoadingConversations(false);
    }
  };

  const handleSendToConversation = async (conversationId) => {
    try {
      setSendingToConversation(conversationId);
      setError(null);

      // Générer l'image
      const canvas = await generateImage();
      if (!canvas) throw new Error('Échec de la génération de l\'image');

      // Convertir en base64 avec qualité réduite pour limiter la taille
      const imageData = canvas.toDataURL('image/jpeg', 0.7);

      // Envoyer via l'API
      await shareSession(conversationId, {
        name: session.name || 'Séance',
        duration: Math.floor((session.durationSec || 0) / 60),
        calories: session.calories || 0,
        exercises: session.entries?.length || 0,
        imageData
      });

      // Success
      setCopySuccess(true);
      setTimeout(() => {
        setCopySuccess(false);
        setShowConversations(false);
        onHide();
      }, 1500);
    } catch (err) {
      logger.error('Erreur envoi session:', err);
      setError('Impossible d\'envoyer la session');
    } finally {
      setSendingToConversation(null);
    }
  };

  if (!show) return null;

  return createPortal(
    <div className={styles.modalOverlay} onClick={onHide}>
      {/* Confetti effect */}
      {showConfetti && (
        <div className={styles.confetti}>
          {[...Array(30)].map((_, i) => (
            <div key={i} className={styles.confettiPiece} style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              backgroundColor: ['#f0a47a', '#72baa1', '#8b5cf6', '#e08c5f', '#aed8c9', '#a78bfa'][Math.floor(Math.random() * 6)]
            }} />
          ))}
        </div>
      )}

      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        {/* Header avec gradient */}
        <div className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <div className={styles.titleWrapper}>
              <h2 className={styles.modalTitle}>Partage ta séance</h2>
              <p className={styles.subtitle}>Montre tes résultats à tes amis</p>
            </div>
            <button className={styles.closeButton} onClick={onHide} aria-label="Fermer">
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {/* Success Alert */}
          {copySuccess && (
            <div className={styles.successPulse}>
              <FaCheckCircle className={styles.successIcon} />
              <span>Action réussie !</span>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className={styles.alert} data-type="error">
              <span className={styles.alertIcon}>❌</span>
              <span>{error}</span>
              <button
                className={styles.alertClose}
                onClick={() => setError(null)}
                aria-label="Fermer l'alerte"
              >
                ×
              </button>
            </div>
          )}

          {/* Card avec effet glass */}
          <div className={styles.cardPreview}>
            <div className={styles.previewLabel}>
              <span className={styles.labelDot}></span>
              Aperçu de ta carte
            </div>
            <div data-share-card className={styles.cardWrapper}>
              <ShareSessionCard session={session} user={user} />
            </div>
          </div>

          {/* Boutons de partage modernes */}
          <div className={styles.shareSection}>
            <div className={styles.quickActions}>
              <button
                className={`${styles.actionBtn} ${styles.primary}`}
                onClick={() => handleShare('whatsapp')}
                disabled={generating}
              >
                <div className={styles.btnIcon}>
                  <FaWhatsapp size={24} />
                </div>
                <div className={styles.btnContent}>
                  <span className={styles.btnTitle}>WhatsApp</span>
                  <span className={styles.btnSubtitle}>Partage direct</span>
                </div>
              </button>

              <button
                className={`${styles.actionBtn} ${styles.message}`}
                onClick={handleShareToChat}
                disabled={generating || loadingConversations}
              >
                <div className={styles.btnIcon}>
                  <FaEnvelope size={24} />
                </div>
                <div className={styles.btnContent}>
                  <span className={styles.btnTitle}>Message</span>
                  <span className={styles.btnSubtitle}>Partager à un ami</span>
                </div>
              </button>

              <button
                className={`${styles.actionBtn} ${styles.secondary}`}
                onClick={handleDownload}
                disabled={generating}
              >
                <div className={styles.btnIcon}>
                  <FaDownload size={24} />
                </div>
                <div className={styles.btnContent}>
                  <span className={styles.btnTitle}>Télécharger</span>
                  <span className={styles.btnSubtitle}>Image HD</span>
                </div>
              </button>
            </div>

            <div className={styles.moreOptions}>
              <div className={styles.divider}>
                <span>Autres options</span>
              </div>

              <div className={styles.socialGrid}>
                <button
                  className={`${styles.socialBtn} ${styles.facebook}`}
                  onClick={() => handleShare('facebook')}
                  disabled={generating}
                  title="Partager sur Facebook"
                >
                  <FaFacebook size={20} />
                </button>

                <button
                  className={`${styles.socialBtn} ${styles.twitter}`}
                  onClick={() => handleShare('twitter')}
                  disabled={generating}
                  title="Partager sur Twitter"
                >
                  <FaTwitter size={20} />
                </button>

                <button
                  className={`${styles.socialBtn} ${styles.link}`}
                  onClick={handleCopyLink}
                  disabled={generating}
                  title="Copier le lien"
                >
                  <FaLink size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Liste des conversations */}
          {showConversations && (
            <div className={styles.conversationsOverlay}>
              <div className={styles.conversationsPanel}>
                <div className={styles.conversationsHeader}>
                  <h3>Choisir une conversation</h3>
                  <button
                    className={styles.closeConversations}
                    onClick={() => setShowConversations(false)}
                    aria-label="Fermer"
                  >
                    <FaTimes />
                  </button>
                </div>

                <div className={styles.conversationsList}>
                  {conversations.map((conv) => (
                    <button
                      key={conv._id}
                      className={styles.conversationItem}
                      onClick={() => handleSendToConversation(conv._id)}
                      disabled={sendingToConversation === conv._id}
                    >
                      <div className={styles.conversationAvatar}>
                        <Avatar
                          src={conv.otherUser?.profile?.profilePicture}
                          name={formatDisplayName(conv.otherUser, 'User')}
                          size="md"
                        />
                      </div>

                      <div className={styles.conversationInfo}>
                        <span className={styles.conversationName}>
                          {conv.otherUser?.pseudo || conv.otherUser?.prenom || 'Utilisateur'}
                        </span>
                        {conv.lastMessage?.content && (
                          <span className={styles.conversationLastMsg}>
                            {conv.lastMessage.content.substring(0, 40)}
                            {conv.lastMessage.content.length > 40 ? '...' : ''}
                          </span>
                        )}
                      </div>

                      {sendingToConversation === conv._id && (
                        <div className={styles.sendingIndicator}>
                          <div className={styles.miniSpinner}></div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {generating && (
            <div className={styles.loadingOverlay}>
              <div className={styles.spinner}></div>
              <p>Génération de ton image...</p>
            </div>
          )}

          {loadingConversations && (
            <div className={styles.loadingOverlay}>
              <div className={styles.spinner}></div>
              <p>Chargement des conversations...</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ShareModal;
