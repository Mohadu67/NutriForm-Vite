const logger = require('../utils/logger.js');
const base = (process.env.FRONTEND_BASE_URL || '').replace(/\/$/, '');

const brand = {
  name: 'Harmonith',
  url: base || 'http://localhost:5173',
};

module.exports = function changeEmailTemplate({ toName = 'utilisateur', newEmail, confirmUrl }) {
  const safeConfirmUrl = /^https?:\/\//.test(confirmUrl)
    ? confirmUrl
    : `${brand.url.replace(/\/$/, '')}${confirmUrl.startsWith('/') ? '' : '/'}${confirmUrl}`;

  logger.info('[CHANGE_EMAIL_TEMPLATE] Generated confirmation URL:', safeConfirmUrl);

  const subject = `Confirme ton nouvel email • ${brand.name}`;

  const text = `Salut ${toName},

Tu as demande a changer ton adresse email pour : ${newEmail}

Confirme ce changement en cliquant sur ce lien :
${safeConfirmUrl}

Ce lien expire dans 24 heures.

Si tu n'es pas a l'origine de cette demande, ignore ce message et ton email actuel restera inchange.`;

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
                Changement d'adresse email
              </p>
            </td>
          </tr>

          <!-- Contenu principal -->
          <tr>
            <td style="padding: 40px 32px; color: #333; line-height: 1.7; font-size: 15px;">
              <h2 style="font-size: 22px; margin: 0 0 16px; color: #222325; font-weight: 700;">Confirme ton nouvel email</h2>
              <p style="margin: 0 0 20px;">Salut <strong>${toName}</strong>,</p>
              <p style="margin: 0 0 16px;">Tu as demande a changer ton adresse email pour :</p>

              <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 10px; padding: 16px; margin: 0 0 24px; text-align: center;">
                <p style="margin: 0; font-size: 16px; font-weight: 600; color: #0369a1;">${newEmail}</p>
              </div>

              <p style="margin: 0 0 24px;">Clique sur le bouton ci-dessous pour confirmer ce changement :</p>

              <table role="presentation" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${safeConfirmUrl}" style="display: inline-block; background: linear-gradient(135deg, #F7B186, #f49b69); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(247, 177, 134, 0.3);">
                      ✅ Confirmer le changement
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 13px; color: #777; margin: 24px 0 8px;">Si le bouton ne fonctionne pas, copie-colle ce lien :</p>
              <p style="font-size: 12px; color: #999; word-break: break-all; background: #f8f8f8; padding: 12px; border-radius: 8px; border: 1px solid #e0e0e0;">${safeConfirmUrl}</p>
            </td>
          </tr>

          <!-- Warning -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 10px; padding: 16px;">
                <p style="margin: 0; font-size: 13px; color: #92400e;">
                  <strong>⚠️ Important :</strong> Ce lien expire dans 24 heures. Apres confirmation, tu devras te reconnecter avec ta nouvelle adresse.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f8f8f8; padding: 32px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 8px; color: #666; font-size: 13px;">
                🔒 Ce lien est personnel et securise
              </p>
              <p style="margin: 0; font-size: 12px; color: #999;">
                Tu n'es pas a l'origine de cette demande ? Ignore ce message, ton email actuel restera inchange.
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
