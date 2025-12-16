import { useState, useEffect, memo } from 'react';
import styles from './LinkPreview.module.css';

/**
 * Aperçu de lien compact (sans og:image pour éviter les erreurs CORP)
 */
const LinkPreview = memo(function LinkPreview({ url }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchPreview = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error('Failed');
        const data = await response.json();
        if (!cancelled && data) setPreview(data);
      } catch {
        // Pas de preview
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPreview();
    return () => { cancelled = true; };
  }, [url]);

  const getDomain = (urlString) => {
    try {
      return new URL(urlString).hostname.replace('www.', '');
    } catch {
      return urlString;
    }
  };

  if (loading || !preview) return null;

  const themeColor = preview.themeColor;

  // Style dynamique avec la couleur du site
  const cardStyle = themeColor ? {
    borderLeft: `3px solid ${themeColor}`
  } : {};

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.previewCard}
      style={cardStyle}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={styles.previewContent}>
        <span
          className={styles.previewDomain}
          style={themeColor ? { color: themeColor } : {}}
        >
          {preview.siteName || getDomain(url)}
        </span>
        {preview.title && (
          <span className={styles.previewTitle}>{preview.title}</span>
        )}
      </div>
    </a>
  );
});

export default LinkPreview;
