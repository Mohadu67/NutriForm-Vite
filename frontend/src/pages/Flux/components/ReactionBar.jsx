import { useState } from 'react';
import social from '../../../shared/api/social.js';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { HeartIcon } from './Icons';
import CommentSection from './CommentSection';
import styles from '../FluxPage.module.css';

export default function ReactionBar({ itemId, targetType, isLiked, likesCount, commentsCount: initialCommentsCount }) {
  const { user: me } = useAuth();
  const [liked, setLiked] = useState(isLiked);
  const [count, setCount] = useState(likesCount || 0);
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount || 0);
  const [showComments, setShowComments] = useState(false);

  const handleLike = async (e) => {
    e.stopPropagation();
    const wasLiked = liked;
    setLiked(!wasLiked);
    setCount(c => wasLiked ? c - 1 : c + 1);
    try {
      if (wasLiked) await social.unlikePost(itemId);
      else await social.likePost(itemId, targetType);
    } catch {
      setLiked(wasLiked);
      setCount(c => wasLiked ? c + 1 : c - 1);
    }
  };

  return (
    <div>
      <div className={styles.reactionBar}>
        <button
          className={`${styles.likeBtn} ${liked ? styles.likeBtnActive : ''}`}
          onClick={handleLike}
          aria-label={liked ? 'Retirer le j\'aime' : 'J\'aime'}
        >
          <HeartIcon filled={liked} />
          <span className={styles.likeBtnCount}>{count > 0 ? count : ''}</span>
        </button>
        <button
          className={`${styles.commentBtn} ${showComments ? styles.commentBtnActive : ''}`}
          onClick={(e) => { e.stopPropagation(); setShowComments(s => !s); }}
          aria-label="Commentaires"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={showComments ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span className={styles.likeBtnCount}>{commentsCount > 0 ? commentsCount : ''}</span>
        </button>
      </div>
      {showComments && (
        <CommentSection
          postId={itemId}
          postType={targetType}
          onCountChange={setCommentsCount}
          myId={me?._id}
        />
      )}
    </div>
  );
}
