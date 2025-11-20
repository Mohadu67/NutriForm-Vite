import { useState, useEffect } from 'react';
import { FaWhatsapp, FaFacebook, FaTwitter, FaDownload, FaLink, FaTimes } from 'react-icons/fa';
import html2canvas from 'html2canvas';
import ShareSessionCard from './ShareSessionCard';
import styles from './ShareModal.module.css';

const ShareModal = ({ show, onHide, session, user }) => {
  const [generating, setGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState(null);

  // Fermer le modal avec Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && show) {
        onHide();
      }
    };

    if (show) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [show, onHide]);

  const generateImage = async () => {
    setGenerating(true);
    setError(null);

    try {
      // Attendre que le modal soit complètement rendu
      await new Promise(resolve => setTimeout(resolve, 300));

      const cardElement = document.querySelector('[data-share-card]');
      if (!cardElement) {
        throw new Error('Impossible de trouver la carte à partager');
      }

      const canvas = await html2canvas(cardElement, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      return canvas;
    } catch (error) {
      console.error('Erreur lors de la génération de l\'image:', error);
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
        link.download = `nutriform-session-${new Date().getTime()}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      });
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors du téléchargement');
    }
  };

  const handleShare = async (platform) => {
    try {
      const canvas = await generateImage();
      if (!canvas) throw new Error('Échec de la génération de l\'image');

      canvas.toBlob(async (blob) => {
        const file = new File([blob], 'nutriform-session.png', { type: 'image/png' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'Ma séance de sport',
              text: `J'ai terminé ma séance sur NutriForm ! 💪`,
            });
          } catch (error) {
            if (error.name !== 'AbortError') {
              console.error('Erreur lors du partage:', error);
              fallbackShare(platform, blob);
            }
          }
        } else {
          fallbackShare(platform, blob);
        }
      });
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors du partage');
    }
  };

  const fallbackShare = (platform, blob) => {
    const url = URL.createObjectURL(blob);
    const text = encodeURIComponent(`J'ai terminé ma séance sur NutriForm ! 💪 ${session.name || ''}`);

    let shareUrl = '';

    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${text}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://nutriform.fr')}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent('https://nutriform.fr')}`;
        break;
      default:
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }

    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const handleCopyLink = () => {
    const shareText = `J'ai terminé ma séance sur NutriForm ! 💪\n\n${session.name || 'Séance de sport'}\n⏱️ ${Math.floor((session.durationSec || 0) / 60)} min\n🔥 ${session.calories || 0} kcal\n\nhttps://nutriform.fr`;

    navigator.clipboard.writeText(shareText).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    }).catch(() => {
      setError('Impossible de copier le texte');
    });
  };

  if (!show) return null;

  return (
    <div className={styles.modalOverlay} onClick={onHide}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Partager ma séance</h2>
          <button className={styles.closeButton} onClick={onHide} aria-label="Fermer">
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {/* Alertes */}
          {copySuccess && (
            <div className={styles.alert} data-type="success">
              <span className={styles.alertIcon}>✅</span>
              <span>Texte copié dans le presse-papier !</span>
              <button
                className={styles.alertClose}
                onClick={() => setCopySuccess(false)}
                aria-label="Fermer l'alerte"
              >
                ×
              </button>
            </div>
          )}

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

          {/* Card */}
          <div data-share-card>
            <ShareSessionCard session={session} user={user} />
          </div>

          {/* Boutons de partage */}
          <div className={styles.shareButtons}>
            <h3 className={styles.shareTitle}>Partager sur</h3>
            <div className={styles.buttonGrid}>
              <button
                className={`${styles.shareBtn} ${styles.whatsapp}`}
                onClick={() => handleShare('whatsapp')}
                disabled={generating}
              >
                <FaWhatsapp size={20} />
                <span>WhatsApp</span>
              </button>

              <button
                className={`${styles.shareBtn} ${styles.facebook}`}
                onClick={() => handleShare('facebook')}
                disabled={generating}
              >
                <FaFacebook size={20} />
                <span>Facebook</span>
              </button>

              <button
                className={`${styles.shareBtn} ${styles.twitter}`}
                onClick={() => handleShare('twitter')}
                disabled={generating}
              >
                <FaTwitter size={20} />
                <span>Twitter</span>
              </button>

              <button
                className={`${styles.shareBtn} ${styles.copy}`}
                onClick={handleCopyLink}
                disabled={generating}
              >
                <FaLink size={20} />
                <span>Copier</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button
            className={styles.downloadBtn}
            onClick={handleDownload}
            disabled={generating}
          >
            <FaDownload />
            <span>{generating ? 'Génération...' : 'Télécharger l\'image'}</span>
          </button>
          <button className={styles.cancelBtn} onClick={onHide}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
