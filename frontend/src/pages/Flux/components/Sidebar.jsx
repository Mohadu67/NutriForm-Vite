import useSearch from '../hooks/useSearch';
import { SearchIcon } from './Icons';
import SearchResults from './SearchResults';
import styles from '../FluxPage.module.css';

export default function Sidebar() {
  const { query, results, searching, followState, search, handleFollow } = useSearch();
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sideCard}>
        <div className={styles.sideTitle}>Trouver des sportifs</div>
        <div className={styles.searchBar}>
          <SearchIcon />
          <input
            type="text"
            placeholder="Pseudo, prénom..."
            value={query}
            onChange={e => search(e.target.value)}
            autoComplete="off"
          />
        </div>
        <SearchResults results={results} searching={searching} query={query} followState={followState} handleFollow={handleFollow} />
        {query.length === 0 && (
          <p className={styles.sideHint}>Recherchez par pseudo ou prénom</p>
        )}
      </div>
    </aside>
  );
}
