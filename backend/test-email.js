require('dotenv').config();
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

async function testEmail() {
  console.log('📧 Test d\'envoi d\'email avec les credentials suivants:');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('Port:', process.env.SMTP_PORT);
  console.log('Secure:', process.env.SMTP_SECURE);
  console.log('User:', process.env.SMTP_USER);
  console.log('Pass:', process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NON DÉFINI');
  console.log('SendGrid:', process.env.SENDGRID_API_KEY ? '✅ Configuré' : '❌ Non configuré');

  
  if (process.env.SENDGRID_API_KEY) {
    console.log('\n📨 Test avec SendGrid...');
    try {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      const msg = {
        to: process.env.SMTP_USER,
        from: process.env.SMTP_USER,
        subject: 'Test SendGrid Harmonith',
        html: '<h1>Test SendGrid</h1><p>Si tu reçois ceci, SendGrid fonctionne ! ✅</p>'
      };
      const result = await sgMail.send(msg);
      console.log('✅ Email SendGrid envoyé avec succès !');
      console.log('Status:', result[0]?.statusCode);
      console.log('📬 Vérifie ta boîte mail:', process.env.SMTP_USER);
      return;
    } catch (error) {
      console.error('❌ Erreur SendGrid:', error.message);
      if (error.response?.body) console.error('Détails:', JSON.stringify(error.response.body, null, 2));
      console.log('\n🔄 Tentative avec SMTP...');
    }
  }

  
  console.log('\n📨 Test avec SMTP...');
  try {
    const secure = process.env.SMTP_SECURE === 'true';
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    
    console.log('\n🔍 Test de connexion SMTP...');
    await transporter.verify();
    console.log('✅ Connexion SMTP réussie !');

    
    console.log('\n📨 Envoi d\'un email de test...');
    const info = await transporter.sendMail({
      from: `"Test Harmonith" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, 
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
