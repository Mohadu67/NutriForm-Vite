import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Spinner, Alert } from 'react-bootstrap';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import {
  getAllSupportTickets,
  getSupportTicketById,
  replyToSupportTicket,
  resolveSupportTicket,
  getSupportTicketStats
} from '../../shared/api/chat';

export default function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('open'); // open, in_progress, resolved, all

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

      // Mettre à jour le ticket dans la liste
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

    try {
      await resolveSupportTicket(selectedTicket._id);
      setSelectedTicket(prev => ({ ...prev, status: 'resolved' }));
      setTickets(prev =>
        prev.map(t => (t._id === selectedTicket._id ? { ...t, status: 'resolved' } : t))
      );
      loadStats();
    } catch (err) {
      console.error('Erreur résolution ticket:', err);
      setError('Impossible de résoudre le ticket.');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      open: 'danger',
      in_progress: 'warning',
      resolved: 'success',
      closed: 'secondary'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      low: 'secondary',
      medium: 'info',
      high: 'warning',
      urgent: 'danger'
    };
    return <Badge bg={variants[priority] || 'info'}>{priority}</Badge>;
  };

  return (
    <>
      <Navbar />
      <Container className="py-5">
        <h1>🎫 Support Tickets</h1>

        {/* Stats */}
        {stats && (
          <Row className="my-4">
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h3>{stats.totalOpen}</h3>
                  <p className="mb-0">Ouverts</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h3>{stats.highPriority}</h3>
                  <p className="mb-0">Haute priorité</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h3>{stats.totalResolved}</h3>
                  <p className="mb-0">Résolus</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h3>{stats.avgResolutionTimeHours}h</h3>
                  <p className="mb-0">Temps moy. résolution</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Filtres */}
        <div className="mb-3">
          <Button
            variant={filter === 'open' ? 'primary' : 'outline-primary'}
            onClick={() => setFilter('open')}
            className="me-2"
          >
            Ouverts
          </Button>
          <Button
            variant={filter === 'in_progress' ? 'primary' : 'outline-primary'}
            onClick={() => setFilter('in_progress')}
            className="me-2"
          >
            En cours
          </Button>
          <Button
            variant={filter === 'resolved' ? 'primary' : 'outline-primary'}
            onClick={() => setFilter('resolved')}
            className="me-2"
          >
            Résolus
          </Button>
          <Button
            variant={filter === 'all' ? 'primary' : 'outline-primary'}
            onClick={() => setFilter('all')}
          >
            Tous
          </Button>
        </div>

        {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

        <Row>
          {/* Liste tickets */}
          <Col md={4}>
            <Card>
              <Card.Header>
                <strong>Tickets ({tickets.length})</strong>
              </Card.Header>
              <Card.Body style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {loading ? (
                  <div className="text-center py-3">
                    <Spinner animation="border" />
                  </div>
                ) : tickets.length === 0 ? (
                  <p className="text-muted">Aucun ticket</p>
                ) : (
                  tickets.map((ticket) => (
                    <Card
                      key={ticket._id}
                      className={`mb-2 ${selectedTicket?._id === ticket._id ? 'border-primary' : ''}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSelectTicket(ticket._id)}
                    >
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                        </div>
                        <h6 className="mb-1">{ticket.subject}</h6>
                        <small className="text-muted">
                          {ticket.userId?.pseudo || ticket.userId?.email}
                        </small>
                        <br />
                        <small className="text-muted">
                          {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
                        </small>
                      </Card.Body>
                    </Card>
                  ))
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Détail ticket */}
          <Col md={8}>
            {selectedTicket ? (
              <Card>
                <Card.Header>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{selectedTicket.subject}</strong>
                      <br />
                      <small className="text-muted">
                        Par {selectedTicket.userId?.pseudo || selectedTicket.userId?.email}
                      </small>
                    </div>
                    <div>
                      {selectedTicket.status !== 'resolved' && (
                        <Button variant="success" size="sm" onClick={handleResolve}>
                          Résoudre
                        </Button>
                      )}
                    </div>
                  </div>
                </Card.Header>
                <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`mb-3 ${msg.role === 'admin' ? 'text-end' : ''}`}
                    >
                      <div
                        style={{
                          display: 'inline-block',
                          maxWidth: '75%',
                          padding: '10px 15px',
                          borderRadius: '12px',
                          background: msg.role === 'admin' ? '#28a745' : msg.role === 'bot' ? '#f0f0f0' : '#007bff',
                          color: msg.role === 'bot' ? '#333' : 'white'
                        }}
                      >
                        {msg.content}
                      </div>
                      <br />
                      <small className="text-muted">
                        {msg.role === 'admin' && `Admin`}
                        {' '}
                        {new Date(msg.createdAt).toLocaleTimeString('fr-FR')}
                      </small>
                    </div>
                  ))}
                </Card.Body>
                <Card.Footer>
                  <Form onSubmit={handleSendReply}>
                    <Form.Group className="mb-2">
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Votre réponse..."
                        disabled={selectedTicket.status === 'resolved' || sending}
                      />
                    </Form.Group>
                    <Button
                      type="submit"
                      disabled={!replyMessage.trim() || selectedTicket.status === 'resolved' || sending}
                    >
                      {sending ? <Spinner animation="border" size="sm" /> : 'Envoyer'}
                    </Button>
                  </Form>
                </Card.Footer>
              </Card>
            ) : (
              <Card>
                <Card.Body className="text-center py-5 text-muted">
                  Sélectionne un ticket pour voir les détails
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
      <Footer />
    </>
  );
}
