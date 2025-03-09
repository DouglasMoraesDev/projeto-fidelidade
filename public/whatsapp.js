// public/whatsapp.js

// Defina a URL base da sua API
const apiBaseUrl = 'http://localhost:3000/api';

async function sendVoucher(client) {
  try {
    console.log(`Enviando voucher para: ${client.fullName}, ID do estabelecimento: ${client.establishmentId}`);

    // Busca a mensagem do voucher a partir do endpoint configurado para o estabelecimento
    const response = await fetch(`${apiBaseUrl}/establishments/${client.establishmentId}/voucher-message`);
    if (!response.ok) {
      throw new Error('Erro ao buscar mensagem do voucher');
    }
    const data = await response.json();
    const voucherMessage = data.voucherMessage || 'Parabéns! Você ganhou um voucher!';

    // Gera o link do WhatsApp e abre-o
    const encodedMessage = encodeURIComponent(voucherMessage);
    const whatsappUrl = `https://wa.me/${client.phone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');

    // Chama o endpoint para zerar os pontos do cliente no banco de dados
    const resetResponse = await fetch(`${apiBaseUrl}/clients/${client.id}/reset`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ establishmentId: client.establishmentId })
    });
    if (!resetResponse.ok) {
      throw new Error('Erro ao resetar pontos do cliente.');
    }
    const resetData = await resetResponse.json();
    console.log(resetData.message);

    alert('Voucher enviado e pontos zerados com sucesso!');
  } catch (error) {
    console.error('Erro ao enviar voucher:', error);
    alert('Erro ao enviar voucher');
  }
}
