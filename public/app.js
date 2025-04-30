// public/app.js

// =========================
// Configuração de URLs
// =========================
const BASE_URL = 'https://projeto-fidelidade-production.up.railway.app';
const API_URL  = `${BASE_URL}/api`;

// =========================
// Wrapper fetch p/ 401 e 402
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

// =========================
// Boas-vindas
// =========================
function showWelcome() {
  const nome = localStorage.getItem('userName');
  if (nome) {
    document.getElementById('user-name').textContent = nome;
  }
}

// =========================
// Tabs do dashboard
// =========================
function initTabs() {
  document.querySelectorAll('.tab-menu button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-menu button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(sec => sec.style.display = 'none');
      document.getElementById(btn.dataset.section).style.display = 'block';
    });
  });
}

// =========================
// Aplica tema e QR
// =========================
function applyTheme(theme) {
  Object.entries(theme).forEach(([key, value]) =>
    document.documentElement.style.setProperty(`--${key}`, value)
  );
}
function renderQRCode() {
  const qrImg = document.getElementById('qrCodeImg');
  const link  = document.getElementById('pointsLink');
  qrImg.src  = `${API_URL}/establishments/${currentEstablishmentId}/qrcode`;
  link.href = `${BASE_URL}/points.html?establishmentId=${currentEstablishmentId}`;
}

// =========================
// Inicialização
// =========================
window.onload = async () => {
  const token = localStorage.getItem('authToken');
  const estId = localStorage.getItem('currentEstablishmentId');
  if (!token || !estId) {
    document.getElementById('loginDiv').style.display  = 'block';
    document.getElementById('dashboard').style.display = 'none';
    return;
  }
  try {
    // 1) pega dados do estabelecimento
    const res = await apiFetch(
      `${API_URL}/establishments/${estId}`,
      { headers:{ 'Authorization': `Bearer ${token}` } }
    );
    const establishment = await res.json();
    currentEstablishmentId = estId;

    // 2) checa assinatura
    const lastPay = establishment.lastPaymentDate
      ? new Date(establishment.lastPaymentDate).getTime()
      : null;
    if (!lastPay || Date.now() - lastPay > 28*24*60*60*1000) {
      alert(lastPay
        ? `Sua assinatura expirou em ${new Date(lastPay).toLocaleDateString()}.`
        : 'Nenhuma data de pagamento registrada. Entre em contato.'
      );
      localStorage.clear();
      return window.location.href = '/payment.html';
    }

    // 3) tema e logo
    applyTheme({
      "primary-color":   establishment.primaryColor,
      "secondary-color": establishment.secondaryColor,
      "background-color":establishment.backgroundColor,
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
    const logoEl = document.getElementById('logo');
    if (logoEl) logoEl.src = establishment.logoURL;
    const metaTheme = document.getElementById('theme-color-meta');
    if (metaTheme) metaTheme.setAttribute('content', establishment.backgroundColor);

    // 4) mostra dashboard
    document.getElementById('loginDiv').style.display  = 'none';
    document.getElementById('dashboard').style.display = 'block';
    showWelcome();
    initTabs();
    loadClients();
    renderQRCode();

  } catch (err) {
    console.error('Erro na inicialização:', err);
  }
};

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
// CRUD de Clientes
// =========================
async function loadClients() {
  try {
    const token = localStorage.getItem('authToken');
    const res = await apiFetch(
      `${API_URL}/clients?establishmentId=${currentEstablishmentId}`,
      { headers:{ 'Authorization':`Bearer ${token}` } }
    );
    const clients = await res.json();
    renderClientsTable(clients);
    displayClients(clients);
  } catch (err) {
    console.error('Erro ao carregar clientes:', err);
  }
}

function renderClientsTable(clients) {
  const tbody = document.getElementById('clientTableBody');
  tbody.innerHTML = clients.map(c => `
    <tr>
      <td>${c.fullName}</td>
      <td>${c.email || ''}</td>
      <td>${c.phone}</td>
      <td>${c.points}</td>
      <td>
        <button onclick="editClient('${c.id}')">Editar</button>
        <button onclick="deleteClient('${c.id}')">Excluir</button>
      </td>
    </tr>
  `).join('');
}

function displayClients(clients) {
  const list = document.getElementById('clients');
  list.innerHTML = '';
  clients.filter(c => c.points >= 10).forEach(c => {
    const li  = document.createElement('li');
    li.textContent = `${c.fullName} - Pontos: ${c.points}`;
    const btn = document.createElement('button');
    btn.textContent = 'Enviar Voucher';
    btn.addEventListener('click', () => sendVoucher(c.id));
    li.appendChild(btn);
    list.appendChild(li);
  });
}

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
    loadClients();
  } catch (err) {
    console.error('Erro no saveClient:', err);
    alert(err.message);
  }
}
document.getElementById('saveClientBtn').addEventListener('click', saveClient);

async function editClient(id) {
  try {
    const token = localStorage.getItem('authToken');
    // 1) Buscar o cliente pelo ID (filtrando no backend ou, aqui, por enquanto, na lista)
    const res = await apiFetch(
      `${API_URL}/clients?establishmentId=${currentEstablishmentId}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error('Erro ao buscar clientes');
    const clients = await res.json();
    const client = clients.find(c => c.id === Number(id));
    if (!client) throw new Error('Cliente não encontrado');

    // 2) Preencher cada input explicitamente com a propriedade correta
    document.getElementById('clientFullName').value = client.fullName || '';
    document.getElementById('clientPhone').value    = client.phone    || '';
    document.getElementById('clientEmail').value    = client.email    || '';
    document.getElementById('clientPoints').value   = client.points   || 0;

    // 3) Ajustar flags e texto do botão
    isEditing       = true;
    editingClientId = id;
    document.getElementById('saveClientBtn').textContent = 'Atualizar Cliente';
  } catch (err) {
    console.error('Erro no editClient:', err);
    alert(err.message);
  }
}


async function deleteClient(id) {
  if (!confirm('Deseja realmente excluir este cliente?')) return;
  const token = localStorage.getItem('authToken');
  try {
    await apiFetch(
      `${API_URL}/clients/${id}?establishmentId=${currentEstablishmentId}`,
      { method:'DELETE', headers:{ 'Authorization':`Bearer ${token}` } }
    );
    alert('Cliente excluído!');
    loadClients();
  } catch (err) {
    console.error('Erro no deleteClient:', err);
    alert(err.message);
  }
}

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
    loadClients();
  } catch (err) {
    console.error('Erro no addPoints:', err);
    alert(err.message);
  }
});

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
    loadClients();
  } catch (err) {
    console.error('Erro no resetClientPoints:', err);
    alert(err.message);
  }
}
