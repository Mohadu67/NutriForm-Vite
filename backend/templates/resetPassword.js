const base = (process.env.FRONTEND_BASE_URL || '').replace(/\/$/, '');
if (!base && process.env.NODE_ENV === 'production') {
  throw new Error('FRONTEND_BASE_URL manquant en production pour les emails.');
}
const brand = {
  name: 'NutriForm',
  url: base || 'http://localhost:5173',
  logo: `${base || 'http://localhost:5173'}/logo.png`,
};

module.exports = function resetPasswordTemplate({ toName = 'utilisateur', resetUrl }) {
  const safeResetUrl = /^https?:\/\//i.test(resetUrl)
    ? resetUrl
    : `${brand.url.replace(/\/$/, '')}${resetUrl.startsWith('/') ? '' : '/'}${resetUrl}`;
  const subject = `Réinitialise ton mot de passe • ${brand.name}`;
  const text = `Salut ${toName},

Tu as demandé une réinitialisation du mot de passe.
Clique sur ce lien pour continuer (valide quelques minutes) :
${safeResetUrl}

Si tu n'es pas à l'origine de cette demande, ignore ce message.`;
  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.5;color:#111;">
    <div style="max-width:560px;margin:0 auto;padding:24px;">
      <div style="text-align:center;margin-bottom:16px;">
        <img src="${brand.logo}" alt="${brand.name}" style="height:36px"/>
      </div>
      <h1 style="font-size:20px;margin:0 0 12px;">Mot de passe oublié ? 😅</h1>
      <p>Pas de panique <strong>${toName}</strong>, ça arrive à tout le monde. Clique pour en choisir un nouveau.</p>
      <p style="margin:20px 0;">
        <a href="${safeResetUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 16px;border-radius:8px;">Réinitialiser mon mot de passe</a>
      </p>
      <p style="font-size:12px;color:#666">Si le bouton ne fonctionne pas, copie ce lien :</p>
      <p style="font-size:12px;color:#666;word-break:break-all;">${safeResetUrl}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
      <p style="font-size:12px;color:#666">Si tu n’es pas à l’origine de cette demande, ignore ce message.</p>
    </div>
  </div>`;
  return { subject, text, html };
};