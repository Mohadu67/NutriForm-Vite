const express = require('express');
const router = express.Router();
const Newsletter = require('../models/Newsletter');
const adminMiddleware = require('../middlewares/admin.middleware');

// Appliquer le middleware admin à toutes les routes
router.use(adminMiddleware);

// GET /api/newsletter-admin - Liste toutes les newsletters
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const newsletters = await Newsletter.find(filter)
      .sort({ createdAt: -1 })
      .select('title subject content scheduledDate status sentAt recipientCount createdAt');

    res.status(200).json({
      success: true,
      count: newsletters.length,
      newsletters
    });
  } catch (error) {
    console.error('Get newsletters error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des newsletters'
    });
  }
});

// GET /api/newsletter-admin/:id - Récupérer une newsletter
router.get('/:id', async (req, res) => {
  try {
    const newsletter = await Newsletter.findById(req.params.id);

    if (!newsletter) {
      return res.status(404).json({
        success: false,
        message: 'Newsletter non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      newsletter
    });
  } catch (error) {
    console.error('Get newsletter error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la newsletter'
    });
  }
});

// POST /api/newsletter-admin - Créer une newsletter
router.post('/', async (req, res) => {
  try {
    const { title, subject, content, scheduledDate, status } = req.body;

    // Validation
    if (!title || !subject || !content || !scheduledDate) {
      return res.status(400).json({
        success: false,
        message: 'Titre, sujet, contenu et date sont requis'
      });
    }

    // Récupérer le prénom de l'admin connecté
    const createdByName = req.user?.prenom || req.user?.pseudo || 'L\'équipe Harmonith';

    const newsletter = new Newsletter({
      title,
      subject,
      content,
      scheduledDate: new Date(scheduledDate),
      status: status || 'draft',
      createdBy: req.user?.email || 'admin',
      createdByName
    });

    await newsletter.save();

    res.status(201).json({
      success: true,
      message: 'Newsletter créée avec succès',
      newsletter
    });
  } catch (error) {
    console.error('Create newsletter error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la newsletter'
    });
  }
});

// PUT /api/newsletter-admin/:id - Mettre à jour une newsletter
router.put('/:id', async (req, res) => {
  try {
    const { title, subject, content, scheduledDate, status } = req.body;

    const newsletter = await Newsletter.findById(req.params.id);

    if (!newsletter) {
      return res.status(404).json({
        success: false,
        message: 'Newsletter non trouvée'
      });
    }

    // Ne pas permettre la modification d'une newsletter déjà envoyée
    if (newsletter.status === 'sent') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de modifier une newsletter déjà envoyée'
      });
    }

    // Mise à jour
    if (title) newsletter.title = title;
    if (subject) newsletter.subject = subject;
    if (content) newsletter.content = content;
    if (scheduledDate) newsletter.scheduledDate = new Date(scheduledDate);
    if (status) newsletter.status = status;

    await newsletter.save();

    res.status(200).json({
      success: true,
      message: 'Newsletter mise à jour avec succès',
      newsletter
    });
  } catch (error) {
    console.error('Update newsletter error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour'
    });
  }
});

// DELETE /api/newsletter-admin/:id - Supprimer une newsletter
router.delete('/:id', async (req, res) => {
  try {
    const newsletter = await Newsletter.findById(req.params.id);

    if (!newsletter) {
      return res.status(404).json({
        success: false,
        message: 'Newsletter non trouvée'
      });
    }

    // Ne pas permettre la suppression d'une newsletter envoyée
    if (newsletter.status === 'sent') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer une newsletter déjà envoyée'
      });
    }

    await Newsletter.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Newsletter supprimée avec succès'
    });
  } catch (error) {
    console.error('Delete newsletter error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression'
    });
  }
});

// POST /api/newsletter-admin/:id/test - Envoyer un email de test
router.post('/:id/test', async (req, res) => {
  try {
    const { testEmail } = req.body;

    if (!testEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email de test requis'
      });
    }

    const newsletter = await Newsletter.findById(req.params.id);

    if (!newsletter) {
      return res.status(404).json({
        success: false,
        message: 'Newsletter non trouvée'
      });
    }

    // Envoyer l'email de test
    const { sendNewsletterEmail } = require('../services/emailService');
    const result = await sendNewsletterEmail(
      testEmail,
      newsletter.subject,
      newsletter.content
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        message: `Email de test envoyé à ${testEmail}`
      });
    } else {
      res.status(500).json({
        success: false,
        message: `Erreur lors de l'envoi: ${result.error}`
      });
    }
  } catch (error) {
    console.error('Test newsletter error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi du test'
    });
  }
});

// POST /api/newsletter-admin/force-send - Forcer l'envoi immédiat des newsletters programmées
router.post('/force-send', async (req, res) => {
  try {
    const { checkAndSendNewsletters } = require('../cron/newsletterCron');

    console.log('🔥 Envoi forcé des newsletters...');
    await checkAndSendNewsletters();

    res.status(200).json({
      success: true,
      message: 'Vérification et envoi des newsletters lancés'
    });
  } catch (error) {
    console.error('Force send error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi forcé'
    });
  }
});

module.exports = router;