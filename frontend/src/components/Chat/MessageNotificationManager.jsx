import { useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import messageNotificationService from '../../services/messageNotificationService';

/**
 * Composant pour gérer les notifications de messages
 * À placer dans le composant principal de l'app
 */
export default function MessageNotificationManager() {
  const { openMatchChat, openChat } = useChat();

  useEffect(() => {
    // Écouter l'événement pour ouvrir une conversation match
    const handleOpenMatchConversation = (event) => {
      const { conversation } = event.detail;
      if (conversation) {
        openMatchChat(conversation);
      }
    };

    // Écouter l'événement pour ouvrir une conversation IA
    const handleOpenConversation = (event) => {
      const { conversationId, type } = event.detail;
      if (type === 'match' && conversationId) {
        // Pour les conversations match, on a besoin de l'objet complet
        // Le service devrait passer la conversation complète
      } else if (type === 'ai' && conversationId) {
        openChat();
      }
    };

    window.addEventListener('openMatchConversation', handleOpenMatchConversation);
    window.addEventListener('openConversation', handleOpenConversation);

    // Démarrer le service de notifications
    messageNotificationService.start();

    return () => {
      window.removeEventListener('openMatchConversation', handleOpenMatchConversation);
      window.removeEventListener('openConversation', handleOpenConversation);
    };
  }, [openMatchChat, openChat]);

  // Ce composant ne rend rien visuellement
  return null;
}