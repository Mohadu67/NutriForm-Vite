const express = require('express');
const router = express.Router();
const Newsletter = require('../models/Newsletter');
const adminMiddleware = require('../middlewares/admin.middleware');
const logger = require('../utils/logger.js');


router.use(adminMiddleware);


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
    logger.error('Get newsletters error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des newsletters'
    });
  }
});


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
    logger.error('Get newsletter error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la newsletter'
    });
  }
});


router.post('/', async (req, res) => {
  try {
    const { title, subject, content, scheduledDate, status } = req.body;

    
    if (!title || !subject || !content || !scheduledDate) {
      return res.status(400).json({
        success: false,
        message: 'Titre, sujet, contenu et date sont requis'
      });
    }

    
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
    logger.error('Create newsletter error:', error);

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

    
    if (newsletter.status === 'sent') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de modifier une newsletter déjà envoyée'
      });
    }

    
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
    logger.error('Update newsletter error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour'
    });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    const newsletter = await Newsletter.findById(req.params.id);

    if (!newsletter) {
      return res.status(404).json({
        success: false,
        message: 'Newsletter non trouvée'
      });
    }

    
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
    logger.error('Delete newsletter error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression'
    });
  }
});


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
    logger.error('Test newsletter error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi du test'
    });
  }
});


router.post('/force-send', async (req, res) => {
  try {
    const { checkAndSendNewsletters } = require('../cron/newsletterCron');

    logger.info('🔥 Envoi forcé des newsletters...');
    await checkAndSendNewsletters();

    res.status(200).json({
      success: true,
      message: 'Vérification et envoi des newsletters lancés'
    });
  } catch (error) {
    logger.error('Force send error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi forcé'
    });
  }
});


router.post('/:id/send-now', async (req, res) => {
  try {
    const newsletter = await Newsletter.findById(req.params.id);

    if (!newsletter) {
      return res.status(404).json({
        success: false,
        message: 'Newsletter non trouvée'
      });
    }

    
    if (newsletter.status === 'sent') {
      return res.status(400).json({
        success: false,
        message: 'Cette newsletter a déjà été envoyée'
      });
    }

    logger.info(`📨 Envoi immédiat de la newsletter: ${newsletter.title}`);

    const { sendNewsletterToAll } = require('../services/emailService');
    const result = await sendNewsletterToAll(newsletter);

    newsletter.recipientCount = result.totalRecipients ?? 0;
    newsletter.successCount = result.successCount ?? 0;
    newsletter.failedCount = result.failedCount ?? 0;

    if (result.success) {
      newsletter.status = 'sent';
      newsletter.sentAt = new Date();
      await newsletter.save();

      logger.info(`✅ Newsletter "${newsletter.title}" envoyée avec succès`);
      logger.info(`   📊 Succès: ${result.successCount}, Échecs: ${result.failedCount}`);

      res.status(200).json({
        success: true,
        message: `Newsletter envoyée avec succès à ${result.successCount} abonnés`,
        stats: {
          successCount: result.successCount,
          failedCount: result.failedCount,
          totalRecipients: result.totalRecipients
        }
      });
    } else {
      newsletter.status = 'failed';
      await newsletter.save();

      logger.error(`❌ Échec de l'envoi de la newsletter "${newsletter.title}"`);

      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi de la newsletter',
        stats: {
          successCount: result.successCount ?? 0,
          failedCount: result.failedCount ?? 0
        }
      });
    }
  } catch (error) {
    logger.error('Send now error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi immédiat'
    });
  }
});

module.exports = router;