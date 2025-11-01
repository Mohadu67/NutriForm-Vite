import { useState } from 'react';
import { Modal, Button, Alert } from 'react-bootstrap';
import { FaWhatsapp, FaFacebook, FaTwitter, FaDownload, FaLink } from 'react-icons/fa';
import html2canvas from 'html2canvas';
import ShareSessionCard from './ShareSessionCard';
import styles from './ShareModal.module.css';

const ShareModal = ({ show, onHide, session, user }) => {
  const [generating, setGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const generateImage = async () => {
    setGenerating(true);

    try {
      const cardElement = document.querySelector('[data-share-card]');
      if (!cardElement) {
        console.error('Card element not found');
        setGenerating(false);
        return null;
      }

      const canvas = await html2canvas(cardElement, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true,
      });

      return canvas;
    } catch (error) {
      console.error('Erreur lors de la génération de l\'image:', error);
      setGenerating(false);
      return null;
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    const canvas = await generateImage();
    if (!canvas) return;

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `nutriform-session-${new Date().getTime()}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  const handleShare = async (platform) => {
    const canvas = await generateImage();
    if (!canvas) return;

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
    });
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Partager ma séance</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {copySuccess && (
          <Alert variant="success" dismissible onClose={() => setCopySuccess(false)}>
            Texte copié dans le presse-papier !
          </Alert>
        )}

        <div data-share-card>
          <ShareSessionCard session={session} user={user} />
        </div>

        <div className={styles.shareButtons}>
          <h6 className="text-center mb-3">Partager sur</h6>
          <div className={styles.buttonGrid}>
            <Button
              variant="success"
              className={styles.shareBtn}
              onClick={() => handleShare('whatsapp')}
              disabled={generating}
            >
              <FaWhatsapp size={20} />
              <span>WhatsApp</span>
            </Button>

            <Button
              variant="primary"
              className={styles.shareBtn}
              onClick={() => handleShare('facebook')}
              disabled={generating}
            >
              <FaFacebook size={20} />
              <span>Facebook</span>
            </Button>

            <Button
              variant="info"
              className={styles.shareBtn}
              onClick={() => handleShare('twitter')}
              disabled={generating}
            >
              <FaTwitter size={20} />
              <span>Twitter</span>
            </Button>

            <Button
              variant="secondary"
              className={styles.shareBtn}
              onClick={handleCopyLink}
              disabled={generating}
            >
              <FaLink size={20} />
              <span>Copier</span>
            </Button>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-primary" onClick={handleDownload} disabled={generating}>
          <FaDownload className="me-2" />
          {generating ? 'Génération...' : 'Télécharger l\'image'}
        </Button>
        <Button variant="secondary" onClick={onHide}>
          Fermer
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ShareModal;