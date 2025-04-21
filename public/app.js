// =========================
// Configuração de URLs
// =========================
// Definimos BASE_URL e API_URL logo no início, para evitar duplicações
const BASE_URL = 'https://projeto-fidelidade-production.up.railway.app';
const API_URL  = `${BASE_URL}/api`;

// =========================
// Estado global
// =========================
// Armazena o establishmentId do usuário logado (inicialmente nulo)
let currentEstablishmentId = null;
// Controle de edição de clientes
let isEditing = false;
let editingClientId = null;

// =========================
// Funções utilitárias
// =========================

/**
 * Aplica as configurações de tema, atualizando variáveis CSS.
 * @param {Object} theme - mapeamento de variáveis CSS para valores.
 */
function applyTheme(theme) {
  Object.entries(theme).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--${key}`, value);
  });
}

/**
 * Renderiza o QR Code e atualiza o link de consulta de pontos.
 * Deve ser chamado somente após currentEstablishmentId estar definido.
 */
function renderQRCode() {
  const qrImg = document.getElementById('qrCodeImg');
  const link  = document.getElementById('pointsLink');

  // URL do endpoint que gera o QR Code
  qrImg.src = `${API_URL}/establishments/${currentEstablishmentId}/qrcode`;
  // Link para a página de pontos, passando o establishmentId
  link.href = `${BASE_URL}/points.html?establishmentId=${currentEstablishmentId}`;
}

// =========================
// Fluxo de inicialização
// =========================
window.onload = async function() {
  // 1) Recupera token e establishmentId do localStorage
  const storedToken = localStorage.getItem('authToken');
  const storedEstId = localStorage.getItem('currentEstablishmentId');

  // 2) Se faltar token ou ID, exibe tela de login e retorna
  if (!storedToken || !storedEstId) {
    document.getElementById('loginDiv').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    return;
  }

  try {
    // 3) Busca dados do estabelecimento para tema e logo
    const res = await fetch(`${API_URL}/establishments/${storedEstId}`, {
      headers: { 'Authorization': `Bearer ${storedToken}` }
    });
    if (!res.ok) throw new Error('Falha ao recuperar dados do estabelecimento');

    const establishment = await res.json();
    currentEstablishmentId = storedEstId; // define o ID global

    // 4) Aplica tema e atualiza logo
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
    const logoElement = document.getElementById('logo');
    if (logoElement) logoElement.src = establishment.logoURL;

    // 5) Exibe dashboard e carrega clientes
    document.getElementById('loginDiv').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    loadClients();

    // 6) Por fim, renderiza o QR Code
    renderQRCode();
  } catch (error) {
    console.error('Erro ao manter login:', error);
    alert('Erro ao carregar dados do estabelecimento. Faça login novamente.');
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentEstablishmentId');
    document.getElementById('loginDiv').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
  }
};

// =========================
// Função de Login
// =========================
document.getElementById('loginBtn').addEventListener('click', async () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!username || !password) {
    return alert('Por favor, preencha todos os campos!');
  }

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (!res.ok) {
      // caso de pagamento pendente ou credenciais inválidas
      if (data.message && data.message.includes('Pagamento pendente')) {
        if (confirm(`${data.message}\nDeseja efetuar o pagamento agora?`)) {
          window.location.href = 'https://mpago.la/1Mc6Lnc';
        }
      } else {
        alert(data.message || 'Usuário ou senha inválidos!');
      }
      return;
    }

    // 1) Ajusta estado global e armazena credenciais
    currentEstablishmentId = data.user.establishmentId;
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('currentEstablishmentId', currentEstablishmentId);

    // 2) Aplica tema e logo do usuário
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

    // 3) Exibe dashboard, carrega clientes e QR Code
    document.getElementById('loginDiv').style.display = 'none';
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
// Função de Logout
// =========================
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentEstablishmentId');
  document.getElementById('loginDiv').style.display = 'block';
  document.getElementById('dashboard').style.display = 'none';
  alert('Logout realizado com sucesso!');
});

// =========================
// Funções de Cliente
// =========================

/**
 * Busca e renderiza a lista de clientes do estabelecimento.
 */
async function loadClients() {
  try {
    const res = await fetch(`${API_URL}/clients?establishmentId=${currentEstablishmentId}`);
    const clients = await res.json();
    renderClientsTable(clients);
    displayClients(clients);
  } catch (err) {
    console.error('Erro ao carregar clientes:', err);
  }
}

/**
 * Gera as linhas da tabela de clientes.
 */
function renderClientsTable(clients) {
  const tbody = document.getElementById('clientTableBody');
  tbody.innerHTML = clients.map(c => `
    <tr>
      <td>${c.fullName}</td>
      <td>${c.email || ''}</td>
      <td>${c.phone}</td>
      <td>${c.points}</td>
      <td id="acoes">
        <button onclick="editClient('${c.id}')">Editar</button>
        <button onclick="deleteClient('${c.id}')">Excluir</button>
      </td>
    </tr>
  `).join('');
}

/**
 * Exibe somente clientes com ao menos 10 pontos e botão de voucher.
 */
function displayClients(clients) {
  const list = document.getElementById('clients');
  list.innerHTML = '';
  clients.filter(c => c.points >= 10).forEach(c => {
    const li = document.createElement('li');
    li.textContent = `${c.fullName} - Pontos: ${c.points}`;
    const btn = document.createElement('button');
    btn.textContent = 'Enviar Voucher';
    btn.addEventListener('click', () => sendVoucher(c.id));
    li.appendChild(btn);
    list.appendChild(li);
  });
}

/**
 * Adiciona ou atualiza um cliente, baseado em isEditing.
 */
async function saveClient() {
  const fullName = document.getElementById('clientFullName').value.trim();
  const phone    = document.getElementById('clientPhone').value.trim();
  const email    = document.getElementById('clientEmail').value.trim();
  const points   = parseInt(document.getElementById('clientPoints').value) || 0;

  if (!fullName || !phone) {
    return alert('Nome e telefone são obrigatórios!');
  }

  const method = isEditing ? 'PUT' : 'POST';
  const url    = isEditing
    ? `${API_URL}/clients/${editingClientId}`
    : `${API_URL}/clients`;
  const body   = { fullName, phone, email, points, establishmentId: currentEstablishmentId };

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erro ao salvar cliente');

    alert(isEditing ? 'Cliente atualizado!' : 'Cliente criado!');
    isEditing = false;
    editingClientId = null;
    document.getElementById('saveClientBtn').textContent = 'Salvar Cliente';
    ['clientFullName','clientPhone','clientEmail','clientPoints'].forEach(id => {
      document.getElementById(id).value = '';
    });
    loadClients();
  } catch (err) {
    console.error('Erro no saveClient:', err);
    alert(err.message);
  }
}
document.getElementById('saveClientBtn').addEventListener('click', saveClient);

/**
 * Popula o form para editar um cliente existente.
 */
async function editClient(id) {
  try {
    const res = await fetch(`${API_URL}/clients?establishmentId=${currentEstablishmentId}`);
    const clients = await res.json();
    const client = clients.find(c => c.id === id);
    if (!client) throw new Error('Cliente não encontrado');

    ['clientFullName','clientPhone','clientEmail','clientPoints'].forEach(field => {
      document.getElementById(field).value = client[field.replace('client','').toLowerCase()] || '';
    });

    isEditing = true;
    editingClientId = id;
    document.getElementById('saveClientBtn').textContent = 'Atualizar Cliente';
  } catch (err) {
    console.error('Erro no editClient:', err);
    alert(err.message);
  }
}

/**
 * Exclui um cliente após confirmação.
 */
async function deleteClient(id) {
  if (!confirm('Deseja realmente excluir este cliente?')) return;
  try {
    const res = await fetch(`${API_URL}/clients/${id}?establishmentId=${currentEstablishmentId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao excluir cliente');
    alert('Cliente excluído!');
    loadClients();
  } catch (err) {
    console.error('Erro no deleteClient:', err);
    alert(err.message);
  }
}

// Busca clientes para o select de pontos
document.getElementById('searchBtn').addEventListener('click', async () => {
  const term = document.getElementById('searchClient').value.trim().toLowerCase();
  try {
    const res = await fetch(`${API_URL}/clients?establishmentId=${currentEstablishmentId}`);
    const clients = await res.json();
    const select = document.getElementById('clientSelect');
    select.innerHTML = '<option value="">Selecione o cliente</option>';
    clients.filter(c => c.fullName.toLowerCase().includes(term))
           .forEach(c => select.append(new Option(c.fullName, c.id)));
  } catch (err) {
    console.error('Erro no searchClient:', err);
  }
});

// Adiciona pontos a um cliente selecionado
document.getElementById('addPointsBtn').addEventListener('click', async () => {
  const clientId = document.getElementById('clientSelect').value;
  const pts      = parseInt(document.getElementById('points').value);
  if (!clientId || !pts) return alert('Selecione cliente e pontos válidos');

  try {
    const res = await fetch(`${API_URL}/clients/${clientId}/points`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pointsToAdd: pts, establishmentId: currentEstablishmentId })
    });
    if (!res.ok) throw new Error('Falha ao adicionar pontos');
    alert('Pontos adicionados com sucesso!');
    loadClients();
  } catch (err) {
    console.error('Erro no addPoints:', err);
    alert(err.message);
  }
});

/**
 * Envia voucher via WhatsApp e reseta os pontos do cliente.
 */
async function sendVoucher(clienteId) {
  try {
    const res = await fetch(`${API_URL}/voucher/${clienteId}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    const url = `https://wa.me/${data.numero}?text=${encodeURIComponent(data.mensagem)}`;
    window.open(url, '_blank');
    await resetClientPoints(clienteId);
  } catch (err) {
    console.error('Erro no sendVoucher:', err);
    alert(err.message);
  }
}

/**
 * Reseta os pontos do cliente após enviar voucher.
 */
async function resetClientPoints(clienteId) {
  try {
    const res = await fetch(`${API_URL}/clients/${clienteId}/reset`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ establishmentId: currentEstablishmentId })
    });
    if (!res.ok) throw new Error('Falha ao resetar pontos');
    const data = await res.json();
    alert(data.message || 'Pontos resetados com sucesso!');
    loadClients();
  } catch (err) {
    console.error('Erro no resetClientPoints:', err);
    alert(err.message);
  }
}
