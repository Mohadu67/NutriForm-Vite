

const express = require('express');
const { sendMail } = require('./mailer.service');

const router = express.Router();

router.post('/contact', async (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Nom, email et message requis.' });
  }

  try {
    await sendMail({
      to: process.env.CONTACT_EMAIL,
      subject: `Nouveau message de ${name}`,
      text: `De: ${name} <${email}>,\n\n${message}`,
      html: `<p><strong>De:</strong> ${name} (${email})</p><p>${message}</p>`,
    });
    return res.json({ message: 'Message envoyé avec succès.' });
  } catch (err) {
    console.error('POST /contact', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;