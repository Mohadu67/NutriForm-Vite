import { useMemo } from 'react';
import styles from './Avatar.module.css';

/**
 * Composant Avatar avec fallback sur les initiales
 * @param {string} src - URL de l'image de profil
 * @param {string} name - Nom complet pour générer les initiales
 * @param {string} size - Taille: 'sm', 'md', 'lg'
 * @param {string} className - Classes CSS additionnelles
 */
export default function Avatar({ src, name = 'User', size = 'md', className = '' }) {
  const getInitials = (fullName) => {
    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }
    return names.slice(0, 2).map(n => n[0]).join('').toUpperCase();
  };

  const getColorFromName = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 60%, 50%)`;
  };

  const initials = useMemo(() => getInitials(name), [name]);
  const bgColor = useMemo(() => getColorFromName(name), [name]);

  const sizeClass = styles[`avatar-${size}`] || styles['avatar-md'];

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${styles.avatar} ${sizeClass} ${className}`}
        onError={(e) => {
          // Si l'image échoue, on remplace par les initiales
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />
    );
  }

  return (
    <div
      className={`${styles.avatarFallback} ${sizeClass} ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      <span className={styles.initials}>{initials}</span>
    </div>
  );
}
