const base = (process.env.FRONTEND_BASE_URL || '').replace(/\/$/, '');
if (!base && process.env.NODE_ENV === 'production') {
  throw new Error('FRONTEND_BASE_URL manquant en production pour les emails.');
}
const brand = {
  name: 'Harmonith',
  url: base || 'http://localhost:5173',
  logo: `${base || 'http://localhost:5173'}/assets/logo/harmonith-domain.svg`,
};

module.exports = function verifyEmailTemplate({ toName = 'utilisateur', verifyUrl }) {
  // S'assurer que l'URL est absolue
  const safeVerifyUrl = /^https?:\/\//i.test(verifyUrl)
    ? verifyUrl
    : `${brand.url.replace(/\/$/, '')}${verifyUrl.startsWith('/') ? '' : '/'}${verifyUrl}`;

  // Log pour debug
  console.log('[VERIFY_EMAIL_TEMPLATE] Generated verification URL:', safeVerifyUrl);

  const subject = `Confirme ton email • ${brand.name}`;
  const text = `Salut ${toName},

Bienvenue sur ${brand.name} !
Confirme ton adresse en cliquant sur ce lien :
${safeVerifyUrl}

Si tu n'es pas à l'origine de cette demande, ignore ce message.`;
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.1);">

          <!-- Header avec gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #F7B186 0%, #f49b69 100%); padding: 40px 32px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 800; font-family: 'Merriweather', serif;">
                Harmonith
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.95); font-size: 14px;">
                Ton coach encore plus proche
              </p>
            </td>
          </tr>

          <!-- Contenu principal -->
          <tr>
            <td style="padding: 40px 32px; color: #333; line-height: 1.7; font-size: 15px;">
              <h2 style="font-size: 22px; margin: 0 0 16px; color: #222325; font-weight: 700;">Bienvenue 👋</h2>
              <p style="margin: 0 0 20px;">Salut <strong>${toName}</strong>,</p>
              <p style="margin: 0 0 24px;">Merci de t'être inscrit ! Pour activer ton compte et commencer ton parcours fitness, confirme ton adresse email.</p>

              <table role="presentation" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${safeVerifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #F7B186, #f49b69); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(247, 177, 134, 0.3);">
                      ✅ Confirmer mon email
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 13px; color: #777; margin: 24px 0 8px;">Si le bouton ne fonctionne pas, copie-colle ce lien :</p>
              <p style="font-size: 12px; color: #999; word-break: break-all; background: #f8f8f8; padding: 12px; border-radius: 8px; border: 1px solid #e0e0e0;">${safeVerifyUrl}</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f8f8f8; padding: 32px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 8px; color: #666; font-size: 13px;">
                🔒 Ce lien est personnel et sécurisé
              </p>
              <p style="margin: 0; font-size: 12px; color: #999;">
                Tu n'es pas à l'origine de cette inscription ? Ignore ce message.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  return { subject, text, html };
};