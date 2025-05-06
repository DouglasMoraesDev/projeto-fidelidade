// public/app.js

// =========================
// Configuração de URLs
// =========================
const BASE_URL = 'https://projeto-fidelidade-production.up.railway.app';
const API_URL  = `${BASE_URL}/api`;

// =========================
// Wrapper de fetch para tratar 401 e 402
// =========================
async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);

  if (res.status === 401) {
    alert('Sessão expirada. Faça login novamente.');
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentEstablishmentId');
    return window.location.href = '/';
  }
  if (res.status === 402) {
    const err = await res.json();
    alert(err.message || 'Assinatura expirada');
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentEstablishmentId');
    return window.location.href = '/payment.html';
  }

  return res;
}

// =========================
// Estado global
// =========================
let currentEstablishmentId = null;
let isEditing = false;
let editingClientId = null;
let clientsData = [];

// =========================
// Tema e QR
// =========================
function applyTheme(theme) {
  Object.entries(theme).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--${key}`, value);
  });
}

function renderQRCode() {
  const qrImg = document.getElementById('qrCodeImg');
  const link  = document.getElementById('pointsLink');
  qrImg.src  = `${API_URL}/establishments/${currentEstablishmentId}/qrcode`;
  link.href = `${BASE_URL}/points.html?establishmentId=${currentEstablishmentId}`;
}

// =========================
// Saudação
// =========================
function showWelcome() {
  const nome = localStorage.getItem('userName') || 'Usuário';
  document.getElementById('user-name').textContent = nome;
}

// =========================
// Inicialização
// =========================
window.onload = async function() {
  const token = localStorage.getItem('authToken');
  const estId = localStorage.getItem('currentEstablishmentId');

  if (!token || !estId) {
    document.getElementById('loginDiv').style.display  = 'block';
    document.getElementById('dashboard').style.display = 'none';
    return;
  }

  try {
    // 1) Buscar estabelecimento e checar assinatura
    const resEst = await apiFetch(
      `${API_URL}/establishments/${estId}`,
      { headers:{ 'Authorization': `Bearer ${token}` } }
    );
    const establishment = await resEst.json();
    currentEstablishmentId = estId;

    // 2) Verifica 28 dias de assinatura
    const lastPay = establishment.lastPaymentDate
      ? new Date(establishment.lastPaymentDate).getTime()
      : 0;
    const now = Date.now();
    if (!lastPay || now - lastPay > 28 * 24 * 60 * 60 * 1000) {
      alert(
        lastPay
          ? `Sua assinatura expirou em ${new Date(lastPay).toLocaleDateString()}.`
          : 'Nenhuma data de pagamento registrada. Entre em contato.'
      );
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentEstablishmentId');
      return window.location.href = '/payment.html';
    }

    // 3) Aplica tema, logo e meta theme-color
    applyTheme({
      "primary-color":    establishment.primaryColor,
      "secondary-color":  establishment.secondaryColor,
      "background-color": establishment.backgroundColor,
      "container-bg":     establishment.containerBg,
      "text-color":       establishment.textColor,
      "header-bg":        establishment.headerBg,
      "footer-bg":        establishment.footerBg,
      "footer-text":      establishment.footerText,
      "input-border":     establishment.inputBorder,
      "button-bg":        establishment.buttonBg,
      "button-text":      establishment.buttonText,
      "section-margin":   establishment.sectionMargin
    });
    document.getElementById('logo').src = establishment.logoURL;
    document.getElementById('theme-color-meta')
      .setAttribute('content', establishment.backgroundColor);

    // 4) Mostrar dashboard
    document.getElementById('loginDiv').style.display  = 'none';
    document.getElementById('dashboard').style.display = 'block';
    showWelcome();
    renderQRCode();
    setupTabListeners();
    await loadClients();

  } catch (error) {
    console.error('Erro na inicialização:', error);
  }
};

// =========================
// Login
// =========================
document.getElementById('loginBtn').addEventListener('click', async () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  if (!username || !password) return alert('Preencha todos os campos!');

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (!res.ok) {
      if (res.status === 402 && confirm(`${data.message}\nDeseja renovar?`)) {
        return window.location.href = '/payment.html';
      }
      return alert(data.message || 'Usuário ou senha inválidos');
    }

    // Salvar dados
    localStorage.setItem('authToken', data.token);
    currentEstablishmentId = data.user.establishmentId;
    localStorage.setItem('currentEstablishmentId', currentEstablishmentId);
    localStorage.setItem('userName', data.user.fullName || data.user.username);

    // Aplica tema e logo do usuário
    applyTheme({
      "primary-color":    data.user['primary-color'],
      "secondary-color":  data.user['secondary-color'],
      "background-color": data.user['background-color'],
      "container-bg":     data.user['container-bg'],
      "text-color":       data.user['text-color'],
      "header-bg":        data.user['header-bg'],
      "footer-bg":        data.user['footer-bg'],
      "footer-text":      data.user['footer-text'],
      "input-border":     data.user['input-border'],
      "button-bg":        data.user['button-bg'],
      "button-text":      data.user['button-text'],
      "section-margin":   data.user['section-margin']
    });
    document.getElementById('logo').src = data.user.logoURL;

    // Mostrar dashboard
    document.getElementById('loginDiv').style.display  = 'none';
    document.getElementById('dashboard').style.display = 'block';
    showWelcome();
    setupTabListeners();
    await loadClients();
    renderQRCode();

    alert('Login bem-sucedido!');
  } catch (err) {
    console.error('Erro no login:', err);
    alert('Erro no login. Tente novamente.');
  }
});

// =========================
// Logout
// =========================
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.clear();
  document.getElementById('loginDiv').style.display  = 'block';
  document.getElementById('dashboard').style.display = 'none';
  alert('Logout realizado com sucesso!');
});

// =========================
// Configura abas e conteúdos
// =========================
function setupTabListeners() {
  const tabs = document.querySelectorAll('.tab-menu button');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.tab-content')
        .forEach(sec => sec.style.display = 'none');
      document.getElementById(btn.dataset.section).style.display = 'block';

      // Se entrar na tabela de clientes
      if (btn.dataset.section === 'tab-table') {
        renderClientsList();
      }

      // Se entrar em notificações
      if (btn.dataset.section === 'tab-notify') {
        // Filtra quem tem exatamente 10 pontos (ou >=10 se preferir)
        displayClients(clientsData.filter(c => c.points === 10));
      }

      // Se entrar na aba QR
      if (btn.dataset.section === 'tab-qr') {
        renderQRCode();
      }
    });
  });
}

// =========================
// CRUD de Clientes + Lista Filtrável
// =========================

// 1) Buscar todos os clientes
async function loadClients() {
  try {
    const token = localStorage.getItem('authToken');
    const res = await apiFetch(
      `${API_URL}/clients?establishmentId=${currentEstablishmentId}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    clientsData = await res.json();
    renderClientsList();
  } catch (err) {
    console.error('Erro ao carregar clientes:', err);
  }
}

// 2) Renderizar lista filtrável na aba “Tabela de Clientes”
function renderClientsList(filter = '') {
  const ul = document.getElementById('clientsList');
  ul.innerHTML = '';

  clientsData
    .filter(c =>
      c.fullName.toLowerCase().includes(filter) ||
      (c.phone && c.phone.includes(filter))
    )
    .forEach(c => {
      const li = document.createElement('li');
      li.dataset.id = c.id;
      li.innerHTML = `
        <span>${c.fullName} — ${c.points} pts</span>
        <div class="actions">
          <button class="btn-edit">Editar</button>
          <button class="btn-delete">Excluir</button>
        </div>`;
      ul.appendChild(li);
    });
}

// 3) Pesquisa em tempo real
document.getElementById('searchClientsInput').addEventListener('input', e => {
  const term = e.target.value.trim().toLowerCase();
  renderClientsList(term);
});

// 4) Delegação de clique na lista
document.getElementById('clientsList').addEventListener('click', async e => {
  const li = e.target.closest('li');
  if (!li) return;
  const id = li.dataset.id;

  if (e.target.classList.contains('btn-edit')) {
    return editClient(id);
  }
  if (e.target.classList.contains('btn-delete')) {
    if (confirm('Deseja realmente excluir este cliente?')) {
      await deleteClient(id);
      return loadClients();
    }
  }

  // Se clicou fora dos botões, abre o card de detalhes
  showClientDetail(id);
});

// 5) Exibir card de detalhes
function showClientDetail(id) {
  const c = clientsData.find(x => x.id == id);
  if (!c) return;
  document.getElementById('detailName').textContent   = c.fullName;
  document.getElementById('detailEmail').textContent  = c.email || '—';
  document.getElementById('detailPhone').textContent  = c.phone || '—';
  document.getElementById('detailPoints').textContent = c.points;

  document.getElementById('clientDetailCard').style.display = 'block';
  document.getElementById('detailBackdrop').style.display  = 'block';
}

// 6) Fechar card via botão ✖ ou clique no backdrop
function closeClientDetail() {
  document.getElementById('clientDetailCard').style.display = 'none';
  document.getElementById('detailBackdrop').style.display  = 'none';
}
document.getElementById('closeDetailCard').addEventListener('click', closeClientDetail);
document.getElementById('detailBackdrop').addEventListener('click', closeClientDetail);

// 7) Salvar ou atualizar cliente
async function saveClient() {
  const fullName = document.getElementById('clientFullName').value.trim();
  const phone    = document.getElementById('clientPhone').value.trim();
  const email    = document.getElementById('clientEmail').value.trim();
  const points   = parseInt(document.getElementById('clientPoints').value) || 0;
  if (!fullName || !phone) return alert('Nome e telefone são obrigatórios!');

  const method = isEditing ? 'PUT' : 'POST';
  const url    = isEditing
    ? `${API_URL}/clients/${editingClientId}`
    : `${API_URL}/clients`;
  const body   = { fullName, phone, email, points, establishmentId: currentEstablishmentId };
  const token  = localStorage.getItem('authToken');

  try {
    const res = await apiFetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });
    await res.json();
    alert(isEditing ? 'Cliente atualizado!' : 'Cliente criado!');
    isEditing = false;
    editingClientId = null;
    document.getElementById('saveClientBtn').textContent = 'Salvar Cliente';
    ['clientFullName','clientPhone','clientEmail','clientPoints']
      .forEach(id => document.getElementById(id).value = '');
    await loadClients();
  } catch (err) {
    console.error('Erro no saveClient:', err);
    alert(err.message);
  }
}
document.getElementById('saveClientBtn').addEventListener('click', saveClient);

// 8) Preparar edição de cliente
async function editClient(id) {
  try {
    const token = localStorage.getItem('authToken');
    const res = await apiFetch(
      `${API_URL}/clients?establishmentId=${currentEstablishmentId}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const clients = await res.json();
    const client = clients.find(c => c.id == id);
    if (!client) throw new Error('Cliente não encontrado');

    document.getElementById('clientFullName').value = client.fullName;
    document.getElementById('clientPhone').value    = client.phone;
    document.getElementById('clientEmail').value    = client.email || '';
    document.getElementById('clientPoints').value   = client.points;

    isEditing = true;
    editingClientId = id;
    document.getElementById('saveClientBtn').textContent = 'Atualizar Cliente';
  } catch (err) {
    console.error('Erro no editClient:', err);
    alert(err.message);
  }
}

// 9) Excluir cliente
async function deleteClient(id) {
  const token = localStorage.getItem('authToken');
  try {
    await apiFetch(
      `${API_URL}/clients/${id}?establishmentId=${currentEstablishmentId}`,
      { method:'DELETE', headers:{ 'Authorization':`Bearer ${token}` } }
    );
    alert('Cliente excluído!');
    await loadClients();
  } catch (err) {
    console.error('Erro no deleteClient:', err);
    alert(err.message);
  }
}

// 10) Buscar e adicionar pontos (aba "Cadastrar Cliente")
document.getElementById('searchBtn').addEventListener('click', async () => {
  const term = document.getElementById('searchClient').value.trim().toLowerCase();
  const token = localStorage.getItem('authToken');
  try {
    const res = await apiFetch(
      `${API_URL}/clients?establishmentId=${currentEstablishmentId}`,
      { headers:{ 'Authorization':`Bearer ${token}` } }
    );
    const clients = await res.json();
    const select = document.getElementById('clientSelect');
    select.innerHTML = '<option value=\"\">Selecione o cliente</option>';
    clients
      .filter(c => c.fullName.toLowerCase().includes(term))
      .forEach(c => select.append(new Option(c.fullName, c.id)));
  } catch (err) {
    console.error('Erro no searchClient:', err);
  }
});

document.getElementById('addPointsBtn').addEventListener('click', async () => {
  const clientId = document.getElementById('clientSelect').value;
  const pts      = parseInt(document.getElementById('points').value);
  if (!clientId || !pts) return alert('Selecione cliente e pontos válidos');
  const token = localStorage.getItem('authToken');

  try {
    await apiFetch(`${API_URL}/clients/${clientId}/points`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ pointsToAdd: pts, establishmentId: currentEstablishmentId })
    });
    alert('Pontos adicionados com sucesso!');
    await loadClients();
  } catch (err) {
    console.error('Erro no addPoints:', err);
    alert(err.message);
  }
});

// 11) Enviar voucher e resetar pontos
async function sendVoucher(clienteId) {
  const token = localStorage.getItem('authToken');
  try {
    const res  = await apiFetch(
      `${API_URL}/voucher/${clienteId}`,
      { headers:{ 'Authorization':`Bearer ${token}` } }
    );
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    window.open(
      `https://wa.me/${data.numero}?text=${encodeURIComponent(data.mensagem)}`,
      '_blank'
    );
    await resetClientPoints(clienteId);
  } catch (err) {
    console.error('Erro no sendVoucher:', err);
    alert(err.message);
  }
}

async function resetClientPoints(clienteId) {
  const token = localStorage.getItem('authToken');
  try {
    const res = await apiFetch(
      `${API_URL}/clients/${clienteId}/reset`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ establishmentId: currentEstablishmentId })
      }
    );
    const data = await res.json();
    alert(data.message || 'Pontos resetados com sucesso!');
    await loadClients();
  } catch (err) {
    console.error('Erro no resetClientPoints:', err);
    alert(err.message);
  }
}

// Função para preencher Notificações
function displayClients(vipList) {
  const ul = document.getElementById('clients');
  ul.innerHTML = '';
  vipList.forEach(c => {
    const li  = document.createElement('li');
    li.textContent = `${c.fullName} — Pontos: ${c.points}`;
    const btn = document.createElement('button');
    btn.textContent = 'Enviar Voucher';
    btn.addEventListener('click', () => sendVoucher(c.id));
    li.appendChild(btn);
    ul.appendChild(li);
  });
}
