const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const admin = require('../middlewares/admin.middleware');
const {
  getAllTickets,
  getTicketById,
  replyToTicket,
  resolveTicket,
  reopenTicket,
  assignTicket,
  getTicketStats
} = require('../controllers/supportTicket.controller');

/**
 * Routes support tickets (admin only)
 */
router.use(auth);
router.use(admin);

router.get('/', getAllTickets);
router.get('/stats', getTicketStats);
router.get('/:id', getTicketById);
router.post('/:id/reply', replyToTicket);
router.post('/:id/resolve', resolveTicket);
router.post('/:id/reopen', reopenTicket);
router.post('/:id/assign', assignTicket);

module.exports = router;
