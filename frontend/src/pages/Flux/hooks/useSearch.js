import { useState, useCallback, useRef } from 'react';
import social from '../../../shared/api/social.js';

export default function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [followState, setFollowState] = useState({});
  const debounceRef = useRef(null);

  const search = useCallback((text) => {
    setQuery(text);
    clearTimeout(debounceRef.current);
    if (text.trim().length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await social.searchUsers(text.trim());
        const users = res.data.users || [];
        setResults(users);
        const state = {};
        users.forEach(u => { state[u._id] = u.isFollowing; });
        setFollowState(state);
      } catch { /* noop */ }
      finally { setSearching(false); }
    }, 300);
  }, []);

  const handleFollow = async (e, userId) => {
    e.preventDefault(); e.stopPropagation();
    const was = followState[userId];
    setFollowState(prev => ({ ...prev, [userId]: !was }));
    try {
      if (was) await social.unfollow(userId);
      else await social.follow(userId);
    } catch { setFollowState(prev => ({ ...prev, [userId]: was })); }
  };

  return { query, results, searching, followState, search, handleFollow };
}
