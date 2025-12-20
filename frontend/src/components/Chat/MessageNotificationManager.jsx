import { useEffect, useRef } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useNavigate } from 'react-router-dom';
import messageNotificationService from '../../services/messageNotificationService';

/**
 * Composant pour gérer les notifications de messages
 * À placer dans le composant principal de l'app
 */
export default function MessageNotificationManager() {
  const { openMatchChat, openChat, openMatchChatById, openAIChat } = useChat() || {};
  const navigate = useNavigate();
  const hasCheckedUrl = useRef(false);

  // Vérifier les query params au démarrage (pour les notifications cliquées quand l'app était fermée)
  useEffect(() => {
    if (hasCheckedUrl.current) return;
    hasCheckedUrl.current = true;

    const params = new URLSearchParams(window.location.search);
    const openChatParam = params.get('openChat');
    const conversationId = params.get('conversationId');
    const chatType = params.get('chatType');

    if (openChatParam === 'true' && conversationId) {
      // Nettoyer l'URL sans recharger la page
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);

      // Attendre que l'app soit prête puis ouvrir le chat
      setTimeout(() => {
        if (chatType === 'match' && openMatchChatById) {
          openMatchChatById(conversationId);
        } else if (chatType === 'ai' && openAIChat) {
          openAIChat(conversationId);
        } else if (openChat) {
          openChat();
        }
      }, 500);
    }
  }, [openMatchChatById, openAIChat, openChat]);

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

    // Écouter les messages du Service Worker (clic sur notification push)
    const handleServiceWorkerMessage = (event) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
        const { url, data } = event.data;

        // Gérer selon le type de notification
        if (data?.type === 'new_message' && data?.conversationId) {
          // Message de match - ouvrir la conversation
          openMatchChatById(data.conversationId);
        } else if (data?.type === 'support' && data?.conversationId) {
          // Message support - ouvrir le chat IA avec cette conversation
          openAIChat(data.conversationId);
        } else if (data?.type === 'support') {
          // Support sans conversationId - ouvrir l'historique
          openChat();
        } else if (data?.conversationId) {
          // Fallback: essayer d'ouvrir comme match d'abord, sinon IA
          openMatchChatById(data.conversationId).then(success => {
            if (!success && openAIChat) {
              openAIChat(data.conversationId);
            }
          });
        } else if (url && !url.includes('openChat=')) {
          // Navigation standard pour les autres types de notifications
          navigate(url);
        }
      }
    };

    window.addEventListener('openMatchConversation', handleOpenMatchConversation);
    window.addEventListener('openConversation', handleOpenConversation);

    // Écouter les messages du Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    // Démarrer le service de notifications
    messageNotificationService.start();

    return () => {
      window.removeEventListener('openMatchConversation', handleOpenMatchConversation);
      window.removeEventListener('openConversation', handleOpenConversation);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, [openMatchChat, openChat, openMatchChatById, openAIChat, navigate]);

  // Ce composant ne rend rien visuellement
  return null;
}