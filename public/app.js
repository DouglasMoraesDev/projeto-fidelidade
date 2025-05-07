// public/app.js

// =========================
// Configuração de URLs
// =========================
const BASE_URL = 'https://projeto-fidelidade-production.up.railway.app'; // URL base do backend
const API_URL  = `${BASE_URL}/api`; // Endpoint da API

// =========================
// Wrapper de fetch para tratar erros de autenticação e assinatura
// =========================
async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);

  // Se retornar 401, é porque a sessão expirou ou token inválido
  if (res.status === 401) {
    alert('Sessão expirada. Faça login novamente.');
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentEstablishmentId');
    window.location.href = '/';
    return;
  }

  // Se retornar 402, é porque a assinatura expirou
  if (res.status === 402) {
    const err = await res.json();
    alert(err.message || 'Assinatura expirada');
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentEstablishmentId');
    window.location.href = '/payment.html';
    return;
  }

  return res;
}

// =========================
// Estado global da aplicação
// =========================
let currentEstablishmentId = null; // ID do estabelecimento logado
let isEditing = false;             // Flag para saber se estamos editando cliente
let editingClientId = null;        // ID do cliente que está sendo editado
let clientsData = [];              // Cache dos clientes carregados

// =========================
// Funções de Tema e QR Code
// =========================

// Aplica as variáveis de tema (cores) no :root do CSS
function applyTheme(theme) {
  Object.entries(theme).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--${key}`, value);
  });
}

// Renderiza o QR Code e o link para consulta de pontos
function renderQRCode() {
  const qrImg = document.getElementById('qrCodeImg');
  const link  = document.getElementById('pointsLink');
  qrImg.src  = `${API_URL}/establishments/${currentEstablishmentId}/qrcode`;
  link.href = `${BASE_URL}/points.html?establishmentId=${currentEstablishmentId}`;
}

// =========================
// Saudação ao usuário
// =========================
function showWelcome() {
  const nome = localStorage.getItem('userName') || 'Usuário';
  document.getElementById('user-name').textContent = nome;
}

// =========================
// Inicialização da aplicação
// =========================
window.onload = async function() {
  const token = localStorage.getItem('authToken');
  const estId = localStorage.getItem('currentEstablishmentId');

  // Se não estiver logado, exibe tela de login
  if (!token || !estId) {
    document.getElementById('loginDiv').style.display  = 'block';
    document.getElementById('dashboard').style.display = 'none';
    return;
  }

  try {
    // Busca dados do estabelecimento para tema e validação de assinatura
    const resEst = await apiFetch(
      `${API_URL}/establishments/${estId}`,
      { headers:{ 'Authorization': `Bearer ${token}` } }
    );
    const establishment = await resEst.json();
    currentEstablishmentId = estId;

    // Verifica data do último pagamento (28 dias de validade)
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

    // Aplica tema, logo e meta tag de cor
    applyTheme({
      "primary-color":   establishment.primaryColor,
      "secondary-color": establishment.secondaryColor,
      "background-color": establishment.backgroundColor,
      "container-bg":    establishment.containerBg,
      "text-color":      establishment.textColor,
      "header-bg":       establishment.headerBg,
      "footer-bg":       establishment.footerBg,
      "footer-text":     establishment.footerText,
      "input-border":    establishment.inputBorder,
      "button-bg":       establishment.buttonBg,
      "button-text":     establishment.buttonText,
      "section-margin":  establishment.sectionMargin
    });
    document.getElementById('logo').src = establishment.logoURL;
    document.getElementById('theme-color-meta')
      .setAttribute('content', establishment.backgroundColor);

    // Mostra dashboard, configura abas e listeners adicionais
    document.getElementById('loginDiv').style.display  = 'none';
    document.getElementById('dashboard').style.display = 'block';
    showWelcome();
    renderQRCode();
    setupTabListeners();       // Configura troca de abas
    setupAddPointsListeners(); // Configura botões da aba de pontos
    await loadClients();       // Carrega lista inicial de clientes

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

    // Se login falhar, trata renovação de assinatura ou erro genérico
    if (!res.ok) {
      if (res.status === 402 && confirm(`${data.message}\nDeseja renovar?`)) {
        return window.location.href = '/payment.html';
      }
      return alert(data.message || 'Usuário ou senha inválidos');
    }

    // Armazena token e dados do usuário no localStorage
    localStorage.setItem('authToken', data.token);
    currentEstablishmentId = data.user.establishmentId;
    localStorage.setItem('currentEstablishmentId', currentEstablishmentId);
    localStorage.setItem('userName', data.user.fullName || data.user.username);

    // Aplica tema e logo do usuário
    applyTheme({
      "primary-color":   data.user['primary-color'],
      "secondary-color": data.user['secondary-color'],
      "background-color":data.user['background-color'],
      "container-bg":    data.user['container-bg'],
      "text-color":      data.user['text-color'],
      "header-bg":       data.user['header-bg'],
      "footer-bg":       data.user['footer-bg'],
      "footer-text":     data.user['footer-text'],
      "input-border":    data.user['input-border'],
      "button-bg":       data.user['button-bg'],
      "button-text":     data.user['button-text'],
      "section-margin":  data.user['section-margin']
    });
    document.getElementById('logo').src = data.user.logoURL;

    // Exibe dashboard após login
    document.getElementById('loginDiv').style.display  = 'none';
    document.getElementById('dashboard').style.display = 'block';
    showWelcome();
    setupTabListeners();
    setupAddPointsListeners();
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
// Configura troca de abas (tabs)
// =========================
function setupTabListeners() {
  const tabs = document.querySelectorAll('.tab-menu button');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove classe active de todas e adiciona à selecionada
      tabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Esconde todas as seções e mostra apenas a clicada
      document.querySelectorAll('.tab-content')
        .forEach(sec => sec.style.display = 'none');
      document.getElementById(btn.dataset.section).style.display = 'block';

      // Se for tabela, renderiza lista de clientes
      if (btn.dataset.section === 'tab-table') {
        renderClientsList();
      }
      // Se for notificações, carrega lista de clientes com 10+ pontos
      if (btn.dataset.section === 'tab-notify') {
        loadNotifications();
      }
    });
  });
}

// =========================
// CRUD de Clientes + Lista Filtrável
// =========================

// Carrega todos os clientes do estabelecimento e guarda em clientsData
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

// Renderiza lista filtrável de clientes na aba “Tabela Clientes”
function renderClientsList(filter = '') {
  const ul = document.getElementById('clientsList');
  ul.innerHTML = ''; // limpa lista

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

// Busca em tempo real ao digitar no campo de pesquisa
document.getElementById('searchClientsInput').addEventListener('input', e => {
  const term = e.target.value.trim().toLowerCase();
  renderClientsList(term);
});

// Ações de editar, excluir ou abrir detalhes ao clicar em um cliente da lista
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
  // Se clicar fora dos botões, abre o detalhe
  showClientDetail(id);
});

// Exibe modal com detalhes do cliente
function showClientDetail(id) {
  const c = clientsData.find(x => x.id == id);
  if (!c) return;
  document.getElementById('detailName').textContent   = c.fullName;
  document.getElementById('detailEmail').textContent  = c.email || '—';
  document.getElementById('detailPhone').textContent  = c.phone || '—';
  document.getElementById('detailPoints').textContent = c.points;

  // Exibe o card e o backdrop
  document.getElementById('clientDetailCard').style.display = 'block';
  document.getElementById('detailBackdrop').style.display  = 'block';
}

// Botão ✖ para fechar o modal de detalhes
document.getElementById('closeDetailCard').addEventListener('click', () => {
  document.getElementById('clientDetailCard').style.display = 'none';
  document.getElementById('detailBackdrop').style.display  = 'none';
});

// Fecha o modal também ao clicar no backdrop (área fora do card)
const backdrop = document.getElementById('detailBackdrop');
if (backdrop) {
  backdrop.addEventListener('click', () => {
    document.getElementById('clientDetailCard').style.display = 'none';
    backdrop.style.display = 'none';
  });
}

// Salvar novo cliente ou atualizar existente
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
    // Reseta flags e campos
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

// Editar cliente: preenche formulário com dados existentes
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

// Deleta cliente pelo ID
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

// =========================
// Aba Adicionar Pontos
// =========================

// Configura listener para botão de busca na aba "Adicionar Pontos"
function setupAddPointsListeners() {
  const btn = document.getElementById('searchPointsBtn');
  if (btn) btn.addEventListener('click', onSearchPoints);
}

// Busca cliente pelo nome e exibe card com input e botão de salvar pontos
async function onSearchPoints() {
  const term = document.getElementById('searchPointsInput').value.trim().toLowerCase();
  if (!term) return;

  const token = localStorage.getItem('authToken');
  const res   = await apiFetch(`${API_URL}/clients?establishmentId=${currentEstablishmentId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const clients = await res.json();
  const c = clients.find(c => c.fullName.toLowerCase().includes(term));
  const container = document.getElementById('addPointsCardContainer');
  container.innerHTML = ''; // Limpa conteúdo anterior

  if (c) {
    // Cria card de cliente com campo para adicionar pontos
    container.innerHTML = `
      <div class="client-card">
        <h4>${c.fullName}</h4>
        <p>Pontos atuais: ${c.points}</p>
        <input type="number" id="ptsToAdd" placeholder="Pontos a adicionar" min="1"/>
        <button id="savePointsBtn">Salvar</button>
      </div>
    `;
    // Listener para salvar pontos
    document.getElementById('savePointsBtn')
      .addEventListener('click', () => addPoints(c.id));
  } else {
    container.textContent = 'Cliente não encontrado.';
  }
}

// Envia request para adicionar pontos ao cliente selecionado
async function addPoints(clientId) {
  const pts = parseInt(document.getElementById('ptsToAdd').value);
  if (!pts || pts < 1) return alert('Insira uma quantidade válida.');

  const token = localStorage.getItem('authToken');
  await apiFetch(`${API_URL}/clients/${clientId}/points`, {
    method: 'POST',
    headers: {
      'Content-Type':'application/json',
      'Authorization':`Bearer ${token}`
    },
    body: JSON.stringify({ pointsToAdd: pts, establishmentId: currentEstablishmentId })
  });
  alert('Pontos adicionados com sucesso!');
  await loadClients();
  document.getElementById('addPointsCardContainer').innerHTML = '';
}

// =========================
// Aba Notificações
// =========================

// Carrega e lista clientes com 10 ou mais pontos para envio de voucher
async function loadNotifications() {
  const token = localStorage.getItem('authToken');
  const res   = await apiFetch(`${API_URL}/clients?establishmentId=${currentEstablishmentId}`, {
    headers:{ 'Authorization':`Bearer ${token}` }
  });
  const clients = await res.json();
  const ul = document.getElementById('clients');
  ul.innerHTML = ''; // limpa lista

  clients
    .filter(c => c.points >= 10) // filtra quem tem >=10 pontos
    .forEach(c => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${c.fullName} — ${c.points} pts</span>
        <button onclick="sendVoucher(${c.id})">Enviar Voucher</button>
      `;
      ul.appendChild(li);
    });
}

// =========================
// Enviar voucher e resetar pontos
// =========================
async function sendVoucher(clienteId) {
  const token = localStorage.getItem('authToken');
  try {
    const res  = await apiFetch(
      `${API_URL}/voucher/${clienteId}`,
      { headers:{ 'Authorization':`Bearer ${token}` } }
    );
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    // Abre WhatsApp Web com mensagem pronta
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

// Reseta pontos do cliente após envio de voucher
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
