// Netlify Function: envia a solicitação de avaliação (com fotos anexadas)
// pro e-mail da True Worth, usando a API da Resend.
//
// Chamada pelo site via POST, com JSON no corpo:
// {
//   ref, plano, nome, email, peca, descricao,
//   photos: [{ filename: "foto1.jpg", contentBase64: "..." }, ...]
// }

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const DESTINO = 'TrueWorth26@gmail.com';

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Método não permitido' };
  }

  try {
    const data = JSON.parse(event.body);
    const { ref, plano, nome, email, peca, descricao, photos } = data;

    if (!nome || !email || !peca) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Campos obrigatórios faltando.' }) };
    }

    const attachments = (photos || []).map((p, i) => ({
      filename: p.filename || `foto-${i + 1}.jpg`,
      content: p.contentBase64,
    }));

    const html = `
      <h2>Nova solicitação de avaliação — True Worth</h2>
      <p><strong>Referência:</strong> ${ref || '-'}</p>
      <p><strong>Plano:</strong> ${plano || '-'}</p>
      <p><strong>Nome:</strong> ${nome}</p>
      <p><strong>Gmail:</strong> ${email}</p>
      <p><strong>Peça:</strong> ${peca}</p>
      <p><strong>Descrição:</strong> ${descricao || '-'}</p>
      <p>${attachments.length} foto(s) anexada(s).</p>
    `;

    const result = await resend.emails.send({
      from: 'True Worth <onboarding@resend.dev>',
      to: DESTINO,
      subject: `Nova solicitação de avaliação — Referência ${ref || ''}`,
      html,
      attachments,
    });

    if (result.error) {
      return { statusCode: 500, body: JSON.stringify({ error: result.error.message }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, id: result.data && result.data.id }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
