(async () => {
    // 1. Pega o establishmentId da URL
    const params = new URLSearchParams(window.location.search);
    const estId = params.get('establishmentId');
    if (!estId) {
      alert('ID do estabelecimento não informado na URL');
      return;
    }
  
    // 2. Busca os dados de tema + logo
    let est;
    try {
      const res = await fetch(`/api/establishments/${estId}`);
      if (!res.ok) throw new Error('Estabelecimento não encontrado');
      est = await res.json();
      console.log('Tema recebido →', est);
    } catch (err) {
      console.error(err);
      return;
    }
  
    // 3. Mapeie as propriedades da resposta aos nomes das suas variáveis CSS
    const varsMap = {
      '--primary-color':          est.primaryColor,
      '--secondary-color':        est.secondaryColor,
      '--background-color':       est.backgroundColor,
      '--container-bg':           est.containerBg,
      '--text-color':             est.textColor,
      '--header-bg':              est.headerBg,
      '--footer-bg':              est.footerBg,
      '--footer-text':            est.footerText,
      '--input-border':           est.inputBorder,
      '--button-bg':              est.buttonBg,
      '--button-text':            est.buttonText,
      '--box-shadow':             est.boxShadow || '0 4px 6px rgba(0,0,0,0.1)',
      '--transition-speed':       est.transitionSpeed || '0.3s',
      '--table-row-hover':        est.tableRowHover
    };
  
    // 4. Aplique cada variável no :root
    const root = document.documentElement;
    Object.entries(varsMap).forEach(([varName, value]) => {
      if (value) root.style.setProperty(varName, value);
    });
  
    // 5. Insira logo e nome
    const logoEl = document.getElementById('est-logo');
    if (est.logoUrl) {
      // ajuste o campo de logo baseado no JSON real da sua API
      logoEl.src = est.logoUrl.startsWith('http')
        ? est.logoUrl
        : `https://projeto-fidelidade-production.up.railway.app${est.logoUrl}`;
      logoEl.style.display = 'block';
    }
    document.getElementById('est-name').textContent = est.name;
  
    // 6. Hook do form para buscar pontos
    document.getElementById('pointsForm').addEventListener('submit', async e => {
      e.preventDefault();
      const phone = document.getElementById('phone').value.trim();
      const out = document.getElementById('result');
  
      try {
        const r2 = await fetch('/api/clients/check-points', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, establishmentId: estId })
        });
        const data2 = await r2.json();
        if (!r2.ok) throw new Error(data2.message || 'Erro');
        out.innerText = `Você tem ${data2.points} ponto(s).`;
      } catch (err) {
        out.innerText = err.message || 'Erro ao buscar pontos.';
      }
    });
  })();
  