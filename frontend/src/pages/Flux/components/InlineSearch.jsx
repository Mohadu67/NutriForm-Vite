import useSearch from '../hooks/useSearch';
import { SearchIcon } from './Icons';
import SearchResults from './SearchResults';
import styles from '../FluxPage.module.css';

export default function InlineSearch() {
  const { query, results, searching, followState, search, handleFollow } = useSearch();
  return (
    <div className={styles.inlineSearch}>
      <div className={styles.inlineSearchInner}>
        <SearchIcon />
        <input
          type="text"
          placeholder="Rechercher des sportifs..."
          value={query}
          onChange={e => search(e.target.value)}
          autoComplete="off"
        />
      </div>
      {(query.length >= 2 || searching) && (
        <div className={styles.inlineSearchResults}>
          <SearchResults results={results} searching={searching} query={query} followState={followState} handleFollow={handleFollow} />
        </div>
      )}
    </div>
  );
}
