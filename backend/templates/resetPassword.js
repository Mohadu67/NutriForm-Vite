const base = (process.env.FRONTEND_BASE_URL || '').replace(/\/$/, '');
if (!base && process.env.NODE_ENV === 'production') {
  throw new Error('FRONTEND_BASE_URL manquant en production pour les emails.');
}
const brand = {
  name: 'Harmonith',
  url: base || 'http://localhost:5173',
  logo: `${base || 'http://localhost:5173'}/assets/logo/harmonith-domain.svg`,
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
      <div style="text-align:center;margin-bottom:24px;">
        <img src="${brand.logo}" alt="Harmonith" style="height:50px;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;" />
        <h1 style="font-size:28px;margin:0;color:#111;font-weight:700;">Harmonith</h1>
        <p style="font-size:14px;margin:4px 0 0;color:#666;font-weight:400;">Ton coach encore plus proche</p>
      </div>
      <h2 style="font-size:20px;margin:0 0 12px;">Mot de passe oublié ? 😅</h2>
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