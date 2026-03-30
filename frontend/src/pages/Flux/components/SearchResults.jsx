import { Link } from 'react-router-dom';
import { getInitials } from '../utils';
import styles from '../FluxPage.module.css';

export default function SearchResults({ results, searching, query, followState, handleFollow }) {
  return (
    <>
      {searching && <div style={{ textAlign: 'center', padding: '8px 0' }}><div className={styles.spinner} /></div>}
      {results.map(user => (
        <Link key={user._id} to={`/social/u/${user._id}`} className={styles.resultRow}>
          {user.photo
            ? <img src={user.photo} alt="" className={styles.resultAvatar} />
            : <div className={styles.resultAvatarPlaceholder}>{getInitials(user.prenom, user.pseudo)}</div>
          }
          <div className={styles.resultMeta}>
            <div className={styles.resultName}>{user.prenom || user.pseudo}</div>
            {user.pseudo && <div className={styles.resultPseudo}>@{user.pseudo}</div>}
          </div>
          <button
            className={`${styles.followBtn} ${followState[user._id] ? styles.followBtnFollowing : styles.followBtnFollow}`}
            onClick={(e) => handleFollow(e, user._id)}
          >
            {followState[user._id] ? '✓ Suivi' : '+ Suivre'}
          </button>
        </Link>
      ))}
      {query.length >= 2 && !searching && results.length === 0 && (
        <p style={{ color: '#AAA', fontSize: 13, textAlign: 'center', padding: '12px 0', margin: 0 }}>Aucun résultat</p>
      )}
    </>
  );
}
