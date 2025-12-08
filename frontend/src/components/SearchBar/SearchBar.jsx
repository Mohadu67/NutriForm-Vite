import { useState } from 'react';
import { MdSearch, MdClose } from 'react-icons/md';
import styles from './SearchBar.module.css';

export default function SearchBar({
  placeholder = "Rechercher...",
  onSearch,
  debounceMs = 300
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debounceTimer, setDebounceTimer] = useState(null);

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Debounce pour éviter trop d'appels
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      onSearch(value);
    }, debounceMs);

    setDebounceTimer(timer);
  };

  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
  };

  return (
    <div className={styles.searchBar}>
      <MdSearch className={styles.searchIcon} />
      <input
        type="text"
        className={styles.searchInput}
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleChange}
      />
      {searchTerm && (
        <button className={styles.clearBtn} onClick={handleClear}>
          <MdClose />
        </button>
      )}
    </div>
  );
}
