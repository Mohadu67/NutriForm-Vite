const SupportTicket = require('../models/SupportTicket');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');

/**
 * Récupérer tous les tickets (admin)
 * GET /api/admin/support-tickets
 */
async function getAllTickets(req, res) {
  try {
    const { status, priority, limit = 50, offset = 0 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tickets = await SupportTicket.find(query)
      .populate('userId', 'pseudo prenom email')
      .populate('assignedTo', 'pseudo prenom')
      .populate('resolvedBy', 'pseudo prenom')
      .sort({ status: 1, priority: -1, updatedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await SupportTicket.countDocuments(query);

    res.status(200).json({
      tickets,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Erreur getAllTickets:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des tickets.' });
  }
}

/**
 * Récupérer un ticket spécifique avec son historique
 * GET /api/admin/support-tickets/:id
 */
async function getTicketById(req, res) {
  try {
    const { id } = req.params;

    const ticket = await SupportTicket.findById(id)
      .populate('userId', 'pseudo prenom email photo')
      .populate('assignedTo', 'pseudo prenom')
      .populate('resolvedBy', 'pseudo prenom');

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket introuvable.' });
    }

    // Récupérer l'historique complet de la conversation
    const messages = await ChatMessage.find({
      conversationId: ticket.conversationId
    })
      .sort({ createdAt: 1 })
      .populate('adminId', 'pseudo prenom');

    res.status(200).json({
      ticket,
      messages
    });
  } catch (error) {
    console.error('Erreur getTicketById:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du ticket.' });
  }
}

/**
 * Répondre à un ticket (admin)
 * POST /api/admin/support-tickets/:id/reply
 */
async function replyToTicket(req, res) {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const adminId = req.userId;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message vide.' });
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket introuvable.' });
    }

    // Créer le message admin
    const adminMessage = await ChatMessage.create({
      userId: ticket.userId,
      conversationId: ticket.conversationId,
      role: 'admin',
      content: message.trim(),
      adminId
    });

    // Mettre à jour le ticket
    if (ticket.status === 'open') {
      ticket.status = 'in_progress';
    }
    if (!ticket.assignedTo) {
      ticket.assignedTo = adminId;
    }
    ticket.messageCount += 1;
    await ticket.save();

    const populatedMessage = await ChatMessage.findById(adminMessage._id)
      .populate('adminId', 'pseudo prenom');

    res.status(200).json({
      message: populatedMessage,
      ticket
    });
  } catch (error) {
    console.error('Erreur replyToTicket:', error);
    res.status(500).json({ error: 'Erreur lors de la réponse au ticket.' });
  }
}

/**
 * Marquer un ticket comme résolu (admin)
 * POST /api/admin/support-tickets/:id/resolve
 */
async function resolveTicket(req, res) {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const adminId = req.userId;

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket introuvable.' });
    }

    ticket.resolve(adminId);
    if (notes) {
      ticket.notes = notes;
    }
    await ticket.save();

    res.status(200).json({
      message: 'Ticket résolu avec succès.',
      ticket
    });
  } catch (error) {
    console.error('Erreur resolveTicket:', error);
    res.status(500).json({ error: 'Erreur lors de la résolution du ticket.' });
  }
}

/**
 * Rouvrir un ticket (admin)
 * POST /api/admin/support-tickets/:id/reopen
 */
async function reopenTicket(req, res) {
  try {
    const { id } = req.params;

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket introuvable.' });
    }

    ticket.status = 'in_progress';
    ticket.resolvedAt = null;
    ticket.resolvedBy = null;
    await ticket.save();

    res.status(200).json({
      message: 'Ticket réouvert.',
      ticket
    });
  } catch (error) {
    console.error('Erreur reopenTicket:', error);
    res.status(500).json({ error: 'Erreur lors de la réouverture du ticket.' });
  }
}

/**
 * Assigner un ticket à un admin (admin)
 * POST /api/admin/support-tickets/:id/assign
 */
async function assignTicket(req, res) {
  try {
    const { id } = req.params;
    const { adminId } = req.body;

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket introuvable.' });
    }

    // Vérifier que l'admin existe
    if (adminId) {
      const admin = await User.findById(adminId);
      if (!admin || admin.role !== 'admin') {
        return res.status(400).json({ error: 'Admin invalide.' });
      }
    }

    ticket.assignedTo = adminId || null;
    await ticket.save();

    res.status(200).json({
      message: adminId ? 'Ticket assigné.' : 'Ticket non-assigné.',
      ticket
    });
  } catch (error) {
    console.error('Erreur assignTicket:', error);
    res.status(500).json({ error: 'Erreur lors de l\'assignation du ticket.' });
  }
}

/**
 * Statistiques des tickets (admin)
 * GET /api/admin/support-tickets/stats
 */
async function getTicketStats(req, res) {
  try {
    const totalOpen = await SupportTicket.countDocuments({ status: { $in: ['open', 'in_progress'] } });
    const totalResolved = await SupportTicket.countDocuments({ status: 'resolved' });
    const totalClosed = await SupportTicket.countDocuments({ status: 'closed' });

    const highPriority = await SupportTicket.countDocuments({
      status: { $in: ['open', 'in_progress'] },
      priority: { $in: ['high', 'urgent'] }
    });

    // Temps moyen de résolution (derniers 30 jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentResolved = await SupportTicket.find({
      status: 'resolved',
      resolvedAt: { $gte: thirtyDaysAgo }
    });

    let avgResolutionTime = 0;
    if (recentResolved.length > 0) {
      const totalTime = recentResolved.reduce((sum, ticket) => {
        const time = ticket.resolvedAt - ticket.createdAt;
        return sum + time;
      }, 0);
      avgResolutionTime = Math.round(totalTime / recentResolved.length / 1000 / 60 / 60); // en heures
    }

    res.status(200).json({
      totalOpen,
      totalResolved,
      totalClosed,
      highPriority,
      avgResolutionTimeHours: avgResolutionTime
    });
  } catch (error) {
    console.error('Erreur getTicketStats:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des stats.' });
  }
}

module.exports = {
  getAllTickets,
  getTicketById,
  replyToTicket,
  resolveTicket,
  reopenTicket,
  assignTicket,
  getTicketStats
};
