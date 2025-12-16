import { memo, useMemo } from 'react';
import LinkPreview from './LinkPreview';
import styles from './MessageContent.module.css';

// Regex pour détecter les URLs
const URL_REGEX = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]"'])/gi;

/**
 * Parse le contenu d'un message et détecte les liens
 */
function parseMessageContent(content) {
  if (!content || typeof content !== 'string') {
    return { parts: [content || ''], urls: [] };
  }

  const urls = [];
  const parts = [];
  let lastIndex = 0;
  let match;

  // Reset regex
  URL_REGEX.lastIndex = 0;

  while ((match = URL_REGEX.exec(content)) !== null) {
    // Ajouter le texte avant le lien
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex, match.index)
      });
    }

    // Ajouter le lien
    const url = match[0];
    parts.push({
      type: 'link',
      content: url
    });
    urls.push(url);

    lastIndex = match.index + url.length;
  }

  // Ajouter le texte restant après le dernier lien
  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.slice(lastIndex)
    });
  }

  // Si pas de liens trouvés, retourner le contenu original
  if (parts.length === 0) {
    parts.push({ type: 'text', content });
  }

  return { parts, urls };
}

/**
 * Composant pour afficher le contenu d'un message avec liens cliquables
 */
const MessageContent = memo(function MessageContent({ content, showPreview = true }) {
  const { parts, urls } = useMemo(() => parseMessageContent(content), [content]);

  // Prendre seulement le premier lien pour le preview
  const firstUrl = urls[0];

  return (
    <div className={styles.contentWrapper}>
      <p className={styles.text}>
        {parts.map((part, index) => {
          if (part.type === 'link') {
            return (
              <a
                key={index}
                href={part.content}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
                onClick={(e) => e.stopPropagation()}
              >
                {part.content}
              </a>
            );
          }
          return <span key={index}>{part.content}</span>;
        })}
      </p>

      {/* Aperçu du premier lien */}
      {showPreview && firstUrl && (
        <LinkPreview url={firstUrl} />
      )}
    </div>
  );
});

export default MessageContent;
