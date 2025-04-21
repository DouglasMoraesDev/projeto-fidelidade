// =========================
// Configuração de URLs
// =========================
const BASE_URL = 'https://projeto-fidelidade-production.up.railway.app';
const API_URL  = `${BASE_URL}/api`;

// =========================
// Wrapper de fetch para tratar assinatura vencida
// =========================
async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (res.status === 402) {
    const err = await res.json();
    alert(err.message || 'Assinatura expirada');
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentEstablishmentId');
    window.location.href = '/payment.html';
    throw new Error('Subscription expired');
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
// Funções utilitárias
// =========================
function applyTheme(theme) {
  Object.entries(theme).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--${key}`, value);
  });
}

function renderQRCode() {
  const qrImg = document.getElementById('qrCodeImg');
  const link  = document.getElementById('pointsLink');
  qrImg.src = `${API_URL}/establishments/${currentEstablishmentId}/qrcode`;
  link.href = `${BASE_URL}/points.html?establishmentId=${currentEstablishmentId}`;
}

// =========================
// Fluxo de inicialização
// =========================
window.onload = async function() {
  const storedToken = localStorage.getItem('authToken');
  const storedEstId = localStorage.getItem('currentEstablishmentId');

  if (!storedToken || !storedEstId) {
    document.getElementById('loginDiv').style.display  = 'block';
    document.getElementById('dashboard').style.display = 'none';
    return;
  }

  try {
    // Busca dados do estabelecimento
    const res = await apiFetch(
      `${API_URL}/establishments/${storedEstId}`,
      { headers: { 'Authorization': `Bearer ${storedToken}` } }
    );
    const establishment = await res.json();
    currentEstablishmentId = storedEstId;

    // Verifica assinatura
    const paymentDate = establishment.lastPaymentDate
      ? new Date(establishment.lastPaymentDate)
      : null;
    if (!paymentDate || new Date() > paymentDate) {
      alert(
        paymentDate
          ? `Sua assinatura expirou em ${paymentDate.toLocaleDateString()}.`
          : 'Nenhuma data de pagamento registrada. Entre em contato.'
      );
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentEstablishmentId');
      return window.location.href = '/payment.html';
    }

    // Aplica tema e logo
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
    const logoEl = document.getElementById('logo');
    if (logoEl) logoEl.src = establishment.logoURL;

    // Exibe dashboard e carrega clientes
    document.getElementById('loginDiv').style.display  = 'none';
    document.getElementById('dashboard').style.display = 'block';
    loadClients();
    renderQRCode();

  } catch (error) {
    console.error('Erro ao manter login:', error);
    alert('Erro ao carregar dados. Faça login novamente.');
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentEstablishmentId');
    document.getElementById('loginDiv').style.display  = 'block';
    document.getElementById('dashboard').style.display = 'none';
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
      if (data.message?.includes('Pagamento pendente')) {
        if (confirm(`${data.message}\nDeseja pagar agora?`)) {
          window.location.href = '/payment.html';
        }
      } else {
        alert(data.message || 'Usuário ou senha inválidos!');
      }
      return;
    }

    currentEstablishmentId = data.user.establishmentId;
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('currentEstablishmentId', currentEstablishmentId);

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
    const logoEl = document.getElementById('logo');
    if (logoEl) logoEl.src = data.user.logoURL;

    document.getElementById('loginDiv').style.display  = 'none';
    document.getElementById('dashboard').style.display = 'block';
    loadClients();
    renderQRCode();

    alert('Login bem‑sucedido!');
  } catch (err) {
    console.error('Erro no login:', err);
    alert('Erro no login. Tente novamente.');
  }
});

// =========================
// Logout
// =========================
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentEstablishmentId');
  document.getElementById('loginDiv').style.display  = 'block';
  document.getElementById('dashboard').style.display = 'none';
  alert('Logout realizado com sucesso!');
});

// =========================
// Funções de Cliente
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
    const res   = await apiFetch(
      `${API_URL}/clients?establishmentId=${currentEstablishmentId}`,
      { headers:{ 'Authorization':`Bearer ${token}` } }
    );
    const clients = await res.json();
    const client  = clients.find(c => c.id === id);
    if (!client) throw new Error('Cliente não encontrado');

    ['clientFullName','clientPhone','clientEmail','clientPoints'].forEach(field => {
      document.getElementById(field).value =
        client[field.replace('client','').toLowerCase()] || '';
    });
    isEditing = true;
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
