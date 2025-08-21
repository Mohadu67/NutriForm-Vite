const brand = {
  name: 'NutriForm',
  url: (process.env.FRONTEND_BASE_URL || 'http://localhost:5173').replace(/\/$/, ''),
  logo: `${(process.env.FRONTEND_BASE_URL || 'http://localhost:5173').replace(/\/$/, '')}/logo.png`,
};

module.exports = function verifyEmailTemplate({ toName = 'utilisateur', verifyUrl }) {
  const subject = `Confirme ton email • ${brand.name}`;
  const text = `Salut ${toName},

Bienvenue sur ${brand.name} !
Confirme ton adresse en cliquant sur ce lien :
${verifyUrl}

Si tu n'es pas à l'origine de cette demande, ignore ce message.`;
  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.5;color:#111;">
    <div style="max-width:560px;margin:0 auto;padding:24px;">
      <div style="text-align:center;margin-bottom:16px;">
        <img src="${brand.logo}" alt="${brand.name}" style="height:36px"/>
      </div>
      <h1 style="font-size:20px;margin:0 0 12px;">Bienvenue 👋</h1>
      <p>Salut <strong>${toName}</strong>, confirme ton adresse pour activer ton compte.</p>
      <p style="margin:20px 0;">
        <a href="${verifyUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 16px;border-radius:8px;">Confirmer mon email</a>
      </p>
      <p style="font-size:12px;color:#666">Si le bouton ne fonctionne pas, copie ce lien :</p>
      <p style="font-size:12px;color:#666;word-break:break-all;">${verifyUrl}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
      <p style="font-size:12px;color:#666">Tu n’es pas à l’origine de cette action ? Ignore ce message.</p>
    </div>
  </div>`;
  return { subject, text, html };
};