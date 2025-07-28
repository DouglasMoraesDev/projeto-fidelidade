(async () => {
  // 1. Pega o establishmentId da URL
  const params = new URLSearchParams(window.location.search);
  const estId = params.get('establishmentId');
  if (!estId) {
    alert('ID do estabelecimento não informado na URL');
    return;
  }

  // 2. Busca dados de tema + logo
  let est;
  try {
    const res = await fetch(`/api/establishments/${estId}`);
    if (!res.ok) throw new Error('Estabelecimento não encontrado');
    est = await res.json();
  } catch (err) {
    console.error(err);
    return;
  }

  // 3. Atualiza meta theme-color
  const meta = document.getElementById('theme-color-meta');
  if (meta && est.backgroundColor) {
    meta.setAttribute('content', est.backgroundColor);
  }

  // 4. Aplica variáveis CSS
  const varsMap = {
    '--primary-color':     est.primaryColor,
    '--secondary-color':   est.secondaryColor,
    '--background-color':  est.backgroundColor,
    '--container-bg':      est.containerBg,
    '--text-color':        est.textColor,
    '--input-border':      est.inputBorder,
    '--button-bg':         est.buttonBg,
    '--button-text':       est.buttonText,
    '--box-shadow':        est.boxShadow || '0 4px 6px rgba(0,0,0,0.1)',
    '--transition-speed':  est.transitionSpeed || '0.3s'
  };
  Object.entries(varsMap).forEach(([k, v]) => {
    if (v) document.documentElement.style.setProperty(k, v);
  });

  // 5. Insere logo e nome
  const logoEl = document.getElementById('est-logo');
  if (est.logoURL) {
    const path = est.logoURL.replace(/^\.\//, '');
    logoEl.src = `${window.location.origin}/${path}`;
    logoEl.style.display = 'block';
  }
  document.getElementById('est-name').textContent = est.name;

  // 6. Busca pontos e renderiza o cartão
  document.getElementById('pointsForm').addEventListener('submit', async e => {
    e.preventDefault();
    const phone = document.getElementById('phone').value.trim();
    const out = document.getElementById('result');
    out.innerHTML = `<p>Carregando seus pontos…</p>`;

    try {
      const res2 = await fetch('/api/clients/check-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, establishmentId: estId })
      });
      const data2 = await res2.json();
      if (!res2.ok) throw new Error(data2.message || 'Erro ao buscar pontos');
      const pts = data2.points;

      // Monta o cartão
      const card = document.createElement('div');
      card.className = 'points-card';

      const stamps = document.createElement('div');
      stamps.className = 'stamps';
      for (let i = 0; i < pts; i++) {
        const img = document.createElement('img');
        img.src = est.logoURL;
        img.alt = 'Carimbo';
        img.className = 'stamp';
        stamps.appendChild(img);
      }

      const msg = document.createElement('p');
      msg.className = 'points-message';
      msg.textContent = pts > 0
        ? `Você tem ${pts} ${pts === 1 ? 'carimbo' : 'carimbos'}! Volte sempre para completar seu cartão 🎉`
        : `Ainda não há carimbos… Participe hoje e comece a ganhar pontos!`;

      card.appendChild(stamps);
      card.appendChild(msg);

      out.innerHTML = '';
      out.appendChild(card);

    } catch (err) {
      out.innerHTML = `<p class="error">Erro: ${err.message}</p>`;
    }
  });
})();
