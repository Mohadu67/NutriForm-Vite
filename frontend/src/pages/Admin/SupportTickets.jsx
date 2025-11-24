import { useState, useEffect } from 'react';
import { MdArrowBack } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import {
  getAllSupportTickets,
  getSupportTicketById,
  replyToSupportTicket,
  resolveSupportTicket,
  getSupportTicketStats
} from '../../shared/api/chat';
import styles from './SupportTickets.module.css';

export default function SupportTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('open');

  useEffect(() => {
    loadTickets();
    loadStats();
  }, [filter]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const filters = filter === 'all' ? {} : { status: filter };
      const data = await getAllSupportTickets(filters);
      setTickets(data.tickets);
    } catch (err) {
      console.error('Erreur chargement tickets:', err);
      setError('Impossible de charger les tickets.');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getSupportTicketStats();
      setStats(data);
    } catch (err) {
      console.error('Erreur chargement stats:', err);
    }
  };

  const handleSelectTicket = async (ticketId) => {
    try {
      const { ticket, messages: msgs } = await getSupportTicketById(ticketId);
      setSelectedTicket(ticket);
      setMessages(msgs);
      setReplyMessage('');
    } catch (err) {
      console.error('Erreur chargement ticket:', err);
      setError('Impossible de charger le ticket.');
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    try {
      setSending(true);
      const { message } = await replyToSupportTicket(selectedTicket._id, replyMessage);
      setMessages(prev => [...prev, message]);
      setReplyMessage('');

      setTickets(prev =>
        prev.map(t => (t._id === selectedTicket._id ? { ...t, status: 'in_progress' } : t))
      );
    } catch (err) {
      console.error('Erreur envoi réponse:', err);
      setError('Impossible d\'envoyer la réponse.');
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedTicket) return;

    const deleteMessages = window.confirm(
      '⚠️ Voulez-vous supprimer les messages de cette conversation ?\n\n' +
      '✅ OUI : Le ticket sera résolu et tous les messages seront supprimés.\n' +
      '❌ NON : Le ticket sera résolu mais les messages seront conservés.'
    );

    try {
      const result = await resolveSupportTicket(selectedTicket._id, '', deleteMessages);

      setSelectedTicket(prev => ({ ...prev, status: 'resolved' }));
      setTickets(prev =>
        prev.map(t => (t._id === selectedTicket._id ? { ...t, status: 'resolved' } : t))
      );
      loadStats();

      if (result.messagesDeleted) {
        setError('✅ Ticket résolu et messages supprimés.');
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      console.error('Erreur résolution ticket:', err);
      setError('Impossible de résoudre le ticket.');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      open: { text: 'Ouvert', class: styles.statusOpen },
      in_progress: { text: 'En cours', class: styles.statusProgress },
      resolved: { text: 'Résolu', class: styles.statusResolved },
      closed: { text: 'Fermé', class: styles.statusClosed }
    };
    const s = statusMap[status] || statusMap.open;
    return <span className={`${styles.badge} ${s.class}`}>{s.text}</span>;
  };

  const getPriorityBadge = (priority) => {
    const priorityMap = {
      low: { text: 'Basse', class: styles.priorityLow },
      medium: { text: 'Moyenne', class: styles.priorityMedium },
      high: { text: 'Haute', class: styles.priorityHigh },
      urgent: { text: 'Urgent', class: styles.priorityUrgent }
    };
    const p = priorityMap[priority] || priorityMap.medium;
    return <span className={`${styles.badge} ${p.class}`}>{p.text}</span>;
  };

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/admin')}>
            <MdArrowBack /> Retour
          </button>
          <h1>Support Tickets</h1>
        </div>

        {/* Error */}
        {error && (
          <div className={styles.alert}>
            ⚠ {error}
            <button onClick={() => setError(null)} className={styles.alertClose}>×</button>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.totalOpen}</div>
              <div className={styles.statLabel}>Ouverts</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.highPriority}</div>
              <div className={styles.statLabel}>Haute priorité</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.totalResolved}</div>
              <div className={styles.statLabel}>Résolus</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.avgResolutionTimeHours}h</div>
              <div className={styles.statLabel}>Temps moyen</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className={styles.filters}>
          <button
            className={`${styles.filterBtn} ${filter === 'open' ? styles.filterBtnActive : ''}`}
            onClick={() => setFilter('open')}
          >
            Ouverts
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'in_progress' ? styles.filterBtnActive : ''}`}
            onClick={() => setFilter('in_progress')}
          >
            En cours
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'resolved' ? styles.filterBtnActive : ''}`}
            onClick={() => setFilter('resolved')}
          >
            Résolus
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'all' ? styles.filterBtnActive : ''}`}
            onClick={() => setFilter('all')}
          >
            Tous
          </button>
        </div>

        <div className={styles.content}>
          {/* Liste tickets */}
          <div className={styles.ticketsList}>
            <div className={styles.ticketsHeader}>
              <strong>Tickets ({tickets.length})</strong>
            </div>
            <div className={styles.ticketsBody}>
              {loading ? (
                <div className={styles.loading}>Chargement...</div>
              ) : tickets.length === 0 ? (
                <div className={styles.emptyList}>Aucun ticket</div>
              ) : (
                tickets.map((ticket) => (
                  <div
                    key={ticket._id}
                    className={`${styles.ticketItem} ${selectedTicket?._id === ticket._id ? styles.ticketItemActive : ''}`}
                    onClick={() => handleSelectTicket(ticket._id)}
                  >
                    <div className={styles.ticketBadges}>
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                    </div>
                    <h4>{ticket.subject}</h4>
                    <div className={styles.ticketMeta}>
                      {ticket.userId?.pseudo || ticket.userId?.email}
                    </div>
                    <div className={styles.ticketDate}>
                      {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Détail ticket */}
          <div className={styles.ticketDetail}>
            {selectedTicket ? (
              <>
                <div className={styles.detailHeader}>
                  <div>
                    <h3>{selectedTicket.subject}</h3>
                    <div className={styles.detailMeta}>
                      Par {selectedTicket.userId?.pseudo || selectedTicket.userId?.email}
                    </div>
                  </div>
                  {selectedTicket.status !== 'resolved' && (
                    <button className={styles.btnResolve} onClick={handleResolve}>
                      Résoudre
                    </button>
                  )}
                </div>

                <div className={styles.messagesContainer}>
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`${styles.message} ${
                        msg.role === 'admin' ? styles.messageAdmin :
                        msg.role === 'bot' ? styles.messageBot :
                        styles.messageUser
                      }`}
                    >
                      <div className={styles.messageBubble}>
                        {msg.content}
                      </div>
                      <div className={styles.messageTime}>
                        {msg.role === 'admin' && 'Admin • '}
                        {new Date(msg.createdAt).toLocaleTimeString('fr-FR')}
                      </div>
                    </div>
                  ))}
                </div>

                <form className={styles.replyForm} onSubmit={handleSendReply}>
                  <textarea
                    className={styles.replyTextarea}
                    rows={3}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Votre réponse..."
                    disabled={selectedTicket.status === 'resolved' || sending}
                  />
                  <button
                    type="submit"
                    className={styles.btnSend}
                    disabled={!replyMessage.trim() || selectedTicket.status === 'resolved' || sending}
                  >
                    {sending ? 'Envoi...' : 'Envoyer'}
                  </button>
                </form>
              </>
            ) : (
              <div className={styles.emptyDetail}>
                <p>Sélectionnez un ticket pour voir les détails</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
