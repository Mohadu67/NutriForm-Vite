require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('📧 Test SMTP avec les credentials suivants:');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('Port:', process.env.SMTP_PORT);
  console.log('User:', process.env.SMTP_USER);
  console.log('Pass:', process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NON DÉFINI');

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Vérifier la connexion
    console.log('\n🔍 Test de connexion SMTP...');
    await transporter.verify();
    console.log('✅ Connexion SMTP réussie !');

    // Envoyer un email de test
    console.log('\n📨 Envoi d\'un email de test...');
    const info = await transporter.sendMail({
      from: `"Test Harmonith" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Envoyer à soi-même pour tester
      subject: 'Test Newsletter Harmonith',
      html: '<h1>Test email</h1><p>Si tu reçois ceci, l\'envoi fonctionne !</p>'
    });

    console.log('✅ Email envoyé avec succès !');
    console.log('Message ID:', info.messageId);
    console.log('📬 Vérifie ta boîte mail:', process.env.SMTP_USER);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.code) console.error('Code:', error.code);
    if (error.response) console.error('Réponse:', error.response);
  }
}

testEmail();
