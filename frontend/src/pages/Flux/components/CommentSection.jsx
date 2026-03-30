import { useState, useEffect } from 'react';
import social from '../../../shared/api/social.js';
import styles from '../FluxPage.module.css';

export default function CommentSection({ postId, postType, onCountChange, myId }) {
  const [comments, setComments] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    social.getComments(postId)
      .then(res => { setComments(res.data?.comments || []); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [postId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    const text = input.trim();
    setInput('');
    try {
      const res = await social.addComment(postId, text, postType);
      const newComment = res.data?.comment;
      if (newComment) {
        setComments(prev => [...prev, newComment]);
        onCountChange?.(prev => prev + 1);
      }
    } catch { setInput(text); }
    finally { setSending(false); }
  };

  const handleDelete = async (commentId) => {
    try {
      await social.deleteComment(postId, commentId);
      setComments(prev => prev.filter(c => c._id !== commentId));
      onCountChange?.(prev => Math.max(0, prev - 1));
    } catch {}
  };

  if (!loaded) return <div className={styles.commentsLoading}>Chargement…</div>;

  return (
    <div className={styles.commentSection}>
      {comments.map(c => (
        <div key={c._id} className={styles.commentRow}>
          <div className={styles.commentAvatar}>
            {c.userAvatar
              ? <img src={c.userAvatar} alt="" className={styles.commentAvatarImg} />
              : <span className={styles.commentAvatarLetter}>{(c.userName || '?').charAt(0).toUpperCase()}</span>
            }
          </div>
          <div className={styles.commentBubble}>
            <span className={styles.commentAuthor}>{c.userName}</span>
            <span className={styles.commentContent}>{c.content}</span>
          </div>
          {myId && (c.userId === myId || c.userId?.toString() === myId?.toString()) && (
            <button className={styles.commentDeleteBtn} onClick={() => handleDelete(c._id)} title="Supprimer">✕</button>
          )}
        </div>
      ))}
      <form className={styles.commentForm} onSubmit={handleSend}>
        <input
          className={styles.commentInput}
          placeholder="Ajouter un commentaire…"
          value={input}
          onChange={e => setInput(e.target.value)}
          maxLength={300}
          disabled={sending}
        />
        <button type="submit" className={styles.commentSendBtn} disabled={!input.trim() || sending}>
          {sending ? '…' : '↑'}
        </button>
      </form>
    </div>
  );
}
