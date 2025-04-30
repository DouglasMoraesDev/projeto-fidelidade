(async () => {
    // 1) Pega establishmentId da query string
    const params = new URLSearchParams(window.location.search);
    const estId = params.get('establishmentId');
    if (!estId) {
      alert('ID do estabelecimento não informado na URL');
      return;
    }
  
    // 2) Busca dados do estabelecimento (tema + logo)
    let est;
    try {
      const r = await fetch(`/api/establishments/${estId}`);
      if (!r.ok) throw new Error('Não encontrado');
      est = await r.json();
    } catch {
      console.error('Erro ao carregar estabelecimento');
      return;
    }
  
    // 3) Aplica variáveis CSS
    const root = document.documentElement;
    root.style.setProperty('--bg-gradient-from', est.backgroundColor);
    root.style.setProperty('--bg-gradient-to',   est.backgroundColorSecondary);
    root.style.setProperty('--container-bg',     est.containerBg);
    root.style.setProperty('--text-color',       est.textColor);
    root.style.setProperty('--heading-color',    est.headingColor);
    root.style.setProperty('--button-bg',        est.buttonBg);
    root.style.setProperty('--button-text',      est.buttonText);
  
    // 4) Insere logo e nome
    const logoEl = document.getElementById('est-logo');
    logoEl.src = est.logoUrl;
    logoEl.style.display = 'block';
    document.getElementById('est-name').textContent = est.name;
  
    // 5) Hook do form para buscar pontos
    document.getElementById('pointsForm').addEventListener('submit', async e => {
      e.preventDefault();
      const phone = document.getElementById('phone').value.trim();
      const out = document.getElementById('result');
  
      try {
        const resp = await fetch('/api/clients/check-points', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, establishmentId: estId })
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.message || 'Erro');
        out.innerText = `Você tem ${data.points} ponto(s).`;
      } catch (err) {
        out.innerText = err.message || 'Erro ao buscar pontos.';
      }
    });
  })();
  