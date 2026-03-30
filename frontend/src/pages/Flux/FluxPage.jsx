import { useState, useEffect, useCallback } from 'react';
import Header from '../../components/Header/Header.jsx';
import Footer from '../../components/Footer/Footer.jsx';
import social from '../../shared/api/social.js';
import FeedCard from './components/FeedCard';
import InlineSearch from './components/InlineSearch';
import Sidebar from './components/Sidebar';
import styles from './FluxPage.module.css';

export default function FluxPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadFeed = useCallback(async (reset = false) => {
    try {
      const currentPage = reset ? 1 : page;
      const res = await social.getFeed(currentPage);
      const { items: newItems, hasMore: more } = res.data;
      if (reset) {
        setItems(newItems || []);
        setPage(2);
      } else {
        setItems(prev => [...prev, ...(newItems || [])]);
        setPage(p => p + 1);
      }
      setHasMore(more);
    } catch { /* noop */ }
    finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page]);

  useEffect(() => { loadFeed(true); }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (loadingMore || !hasMore) return;
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (scrolled >= total - 400) {
        setLoadingMore(true);
        loadFeed(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore, loadFeed]);

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.layout}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Flux</h1>
          <p className={styles.pageSubtitle}>Séances, repas, recettes et défis de ceux que vous suivez</p>
        </div>

        <InlineSearch />

        <main className={styles.feed}>
          {loading ? (
            <div className={styles.loader}><div className={styles.spinner} /></div>
          ) : items.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>👥</div>
              <div className={styles.emptyTitle}>Votre flux est vide</div>
              <div className={styles.emptySubtitle}>
                Suivez des sportifs pour voir leurs séances, repas, recettes et défis ici.
              </div>
            </div>
          ) : (
            <>
              {items.map(item => <FeedCard key={`${item.type}-${item._id}`} item={item} />)}
              {loadingMore && <div className={styles.loadMore}><div className={styles.spinner} /></div>}
              {!hasMore && items.length > 0 && (
                <div className={styles.endOfFeed}>Vous êtes à jour ✓</div>
              )}
            </>
          )}
        </main>

        <Sidebar />
      </div>
      <Footer />
    </div>
  );
}
