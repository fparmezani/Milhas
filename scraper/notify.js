const nodemailer = require('nodemailer');

async function sendAlert(promotions, settings) {
  const { notifyEmail } = settings;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;

  if (!user || !pass) {
    console.log('[Notify] Variáveis GMAIL_USER/GMAIL_PASS não definidas — e-mail ignorado.');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  const rows = promotions
    .map(p => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">${p.airlineName}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${p.title}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">
          <a href="${p.url}" style="color:#1a73e8">Ver promoção</a>
        </td>
      </tr>`)
    .join('');

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#1a73e8">Novas Promoções de Milhas Encontradas!</h2>
      <p>O Monitor de Milhas encontrou <strong>${promotions.length}</strong> promoção(ões) acima do seu limite.</p>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f5f5f5">
            <th style="padding:8px;text-align:left">Companhia</th>
            <th style="padding:8px;text-align:left">Promoção</th>
            <th style="padding:8px;text-align:left">Link</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="color:#666;font-size:12px;margin-top:24px">
        Verificado em: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
      </p>
    </div>`;

  await transporter.sendMail({
    from: `"Monitor de Milhas" <${user}>`,
    to: notifyEmail,
    subject: `🎯 ${promotions.length} promoção(ões) de milhas acima do seu limite!`,
    html,
  });

  console.log(`[Notify] E-mail enviado para ${notifyEmail}`);
}

module.exports = sendAlert;
