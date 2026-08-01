// Netlify Function: envia a solicitação de avaliação (com fotos anexadas)
// pro e-mail da True Worth, chamando a API HTTP da Resend diretamente
// (sem depender do pacote npm "resend", pra evitar problemas de empacotamento).
//
// Chamada pelo site via POST, com JSON no corpo:
// {
//   ref, plano, nome, email, peca, descricao,
//   photos: [{ filename: "foto1.jpg", contentBase64: "..." }, ...]
// }

const DESTINO = 'trueworth26@gmail.com';

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método não permitido' }) };
  }

  try {
    if (!process.env.RESEND_API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: 'RESEND_API_KEY não configurada no servidor.' }) };
    }

    const data = JSON.parse(event.body);
    const { ref, plano, nome, email, peca, descricao, photos } = data || {};

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

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'True Worth <onboarding@resend.dev>',
        to: [DESTINO],
        subject: `Nova solicitação de avaliação — Referência ${ref || ''}`,
        html,
        attachments,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      return {
        statusCode: resendRes.status,
        body: JSON.stringify({ error: resendData.message || 'Erro ao enviar via Resend.', details: resendData }),
      };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, id: resendData.id }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message, stack: err.stack }) };
  }
};
