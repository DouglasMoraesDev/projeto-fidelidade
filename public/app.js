// public/app.js

// =========================
// Configuração de URLs
// =========================
const BASE_URL = 'https://projeto-fidelidade-production.up.railway.app';
const API_URL  = `${BASE_URL}/api`;

// =========================
// Wrapper de fetch para tratar erros de autenticação e assinatura
// =========================
async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (res.status === 401) {
    alert('Sessão expirada. Faça login novamente.');
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentEstablishmentId');
    window.location.href = '/';
    return;
  }
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
  Object.entries(theme).forEach(([k,v]) =>
    document.documentElement.style.setProperty(`--${k}`,v)
  );
}
function renderQRCode() {
  document.getElementById('qrCodeImg').src =
    `${API_URL}/establishments/${currentEstablishmentId}/qrcode`;
  document.getElementById('pointsLink').href =
    `${BASE_URL}/points.html?establishmentId=${currentEstablishmentId}`;
}

// =========================
// Drawer toggle
// =========================
const menuBtn     = document.getElementById('menuBtn');
const sideMenu    = document.getElementById('sideMenu');
const menuOverlay = document.getElementById('menuOverlay');
if (menuBtn && sideMenu && menuOverlay) {
  menuBtn.addEventListener('click', () => {
    sideMenu.classList.toggle('open');
    menuOverlay.classList.toggle('open');
  });
  menuOverlay.addEventListener('click', () => {
    sideMenu.classList.remove('open');
    menuOverlay.classList.remove('open');
  });
}

// =========================
// Inicialização
// =========================
window.onload = async () => {
  const token = localStorage.getItem('authToken');
  const estId = localStorage.getItem('currentEstablishmentId');
  if (!token || !estId) {
    document.getElementById('loginDiv').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    return;
  }

  try {
    const resEst = await apiFetch(
      `${API_URL}/establishments/${estId}`,
      { headers:{ 'Authorization': `Bearer ${token}` } }
    );
    const est = await resEst.json();
    currentEstablishmentId = estId;

    // valida assinatura...
    const lastPay = est.lastPaymentDate
      ? new Date(est.lastPaymentDate).getTime() : 0;
    if (!lastPay || (Date.now() - lastPay) > 28*24*60*60*1000) {
      alert('Assinatura expirada.');
      localStorage.clear();
      return window.location.href = '/payment.html';
    }

    applyTheme({
      "primary-color":   est.primaryColor,
      "secondary-color": est.secondaryColor,
      "background-color":est.backgroundColor,
      "container-bg":    est.containerBg,
      "text-color":      est.textColor,
      "header-bg":       est.headerBg,
      "footer-bg":       est.footerBg,
      "footer-text":     est.footerText,
      "input-border":    est.inputBorder,
      "button-bg":       est.buttonBg,
      "button-text":     est.buttonText,
      "section-margin":  est.sectionMargin
    });
    document.getElementById('logo').src = est.logoURL;
    document.getElementById('theme-color-meta')
      .setAttribute('content', est.backgroundColor);

    document.getElementById('loginDiv').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    showWelcome();
    renderQRCode();
    setupTabListeners();
    setupAddPointsListeners();
    await loadClients();

  } catch(e) {
    console.error(e);
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
// Configura troca de abas (tabs)
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

      if (btn.dataset.section === 'tab-table') {
        renderClientsList();
      }
      if (btn.dataset.section === 'tab-notify') {
        loadNotifications();
      }
    });
  });
}

// =========================
// CRUD de Clientes + Lista Filtrável
// =========================
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

document.getElementById('searchClientsInput')
  .addEventListener('input', e => renderClientsList(e.target.value.trim().toLowerCase()));

document.getElementById('clientsList')
  .addEventListener('click', async e => {
    const li = e.target.closest('li');
    if (!li) return;
    const id = li.dataset.id;
    if (e.target.classList.contains('btn-edit')) return editClient(id);
    if (e.target.classList.contains('btn-delete')) {
      if (confirm('Deseja realmente excluir este cliente?')) {
        await deleteClient(id);
        return loadClients();
      }
    }
    showClientDetail(id);
  });

// =========================
// Detalhes do Cliente (modal)
// =========================
function showClientDetail(id) {
  const c = clientsData.find(x => x.id == id);
  if (!c) return;
  document.getElementById('detailName').textContent   = c.fullName;
  document.getElementById('detailEmail').textContent  = c.email  || '—';
  document.getElementById('detailPhone').textContent  = c.phone  || '—';
  document.getElementById('detailPoints').textContent = c.points;

  document.getElementById('clientDetailCard').style.display = 'block';
  document.getElementById('detailBackdrop'   ).style.display = 'block';
}

document.getElementById('closeDetailCard').addEventListener('click', () => {
  document.getElementById('clientDetailCard').style.display = 'none';
  document.getElementById('detailBackdrop'   ).style.display = 'none';
});
document.getElementById('detailBackdrop').addEventListener('click', () => {
  document.getElementById('clientDetailCard').style.display = 'none';
  document.getElementById('detailBackdrop'   ).style.display = 'none';
});

// =========================
// Salvar / Atualizar Cliente
// =========================
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
    isEditing = false; editingClientId = null;
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

// =========================
// Editar Cliente
// =========================
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

    isEditing = true; editingClientId = id;
    document.getElementById('saveClientBtn').textContent = 'Atualizar Cliente';
  } catch (err) {
    console.error('Erro no editClient:', err);
    alert(err.message);
  }
}

// =========================
// Deletar Cliente
// =========================
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
function setupAddPointsListeners() {
  const btn = document.getElementById('searchPointsBtn');
  if (btn) btn.addEventListener('click', onSearchPoints);
}
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
  container.innerHTML = '';
  if (c) {
    container.innerHTML = `
      <div class="client-card">
        <h4>${c.fullName}</h4>
        <p>Pontos atuais: ${c.points}</p>
        <input type="number" id="ptsToAdd" placeholder="Pontos a adicionar" min="1"/>
        <button id="savePointsBtn">Salvar</button>
      </div>
    `;
    document.getElementById('savePointsBtn')
      .addEventListener('click', () => addPoints(c.id));
  } else {
    container.textContent = 'Cliente não encontrado.';
  }
}
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
async function loadNotifications() {
  const token = localStorage.getItem('authToken');
  const res   = await apiFetch(`${API_URL}/clients?establishmentId=${currentEstablishmentId}`, {
    headers:{ 'Authorization':`Bearer ${token}` }
  });
  const clients = await res.json();
  const ul = document.getElementById('clients');
  ul.innerHTML = '';
  clients
    .filter(c => c.points >= 10)
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
    window.open(
      `https://wa.me/${data.numero}?text=${encodeURIComponent(data.mensagem)}`,
      '_blank'
    );
    await resetClientPoints(clienteId);
    await loadNotifications();
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
  } catch (err) {
    console.error('Erro no resetClientPoints:', err);
    alert(err.message);
  }
}
