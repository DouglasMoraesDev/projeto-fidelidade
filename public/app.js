// Define a URL base da API já com o prefixo /api
const API_URL = 'https://projeto-fidelidade-production.up.railway.app/api';
BASE_URL="https://projeto-fidelidade-production.up.railway.app"


// Variável global para armazenar o establishmentId do usuário logado
let currentEstablishmentId = null;

// Variáveis para controle do estado de edição
let isEditing = false;
let editingClientId = null;

/**
 * Aplica as configurações de tema atualizando as variáveis CSS.
 * @param {Object} theme - Objeto contendo as configurações de tema.
 */
function applyTheme(theme) {
  Object.entries(theme).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--${key}`, value);
  });
}

// Verifica se o usuário está logado ao carregar a página
window.onload = async function() {
  const storedToken = localStorage.getItem('authToken');
  const storedEstablishmentId = localStorage.getItem('currentEstablishmentId');

  if (!storedToken || !storedEstablishmentId) {
    document.getElementById('loginDiv').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    return;
  }

  try {
    // Busca os dados do estabelecimento para aplicar o tema
    const response = await fetch(`${API_URL}/establishments/${storedEstablishmentId}`, {
      headers: { 'Authorization': `Bearer ${storedToken}` }
    });

    if (!response.ok) throw new Error('Falha ao recuperar os dados do estabelecimento');

    const establishment = await response.json();
    currentEstablishmentId = storedEstablishmentId;

    // Aplica o tema com base nas configurações do estabelecimento
    applyTheme({
      "primary-color": establishment.primaryColor,
      "secondary-color": establishment.secondaryColor,
      "background-color": establishment.backgroundColor,
      "container-bg": establishment.containerBg,
      "text-color": establishment.textColor,
      "header-bg": establishment.headerBg,
      "footer-bg": establishment.footerBg,
      "footer-text": establishment.footerText,
      "input-border": establishment.inputBorder,
      "button-bg": establishment.buttonBg,
      "button-text": establishment.buttonText,
      "section-margin": establishment.sectionMargin
    });

    const logoElement = document.getElementById('logo');
    if (logoElement) {
      logoElement.src = establishment.logoURL;
    }

    document.getElementById('loginDiv').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    loadClients();
    
  } catch (error) {
    console.error('Erro ao manter login:', error);
    alert('Erro ao carregar os dados do estabelecimento. Faça login novamente.');
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentEstablishmentId');
    document.getElementById('loginDiv').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
  }
};

// Função de Login
document.getElementById('loginBtn').addEventListener('click', async () => {
  const inputUsername = document.getElementById('username').value;
  const inputPassword = document.getElementById('password').value;

  if (!inputUsername || !inputPassword) {
    alert('Por favor, preencha todos os campos!');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: inputUsername, password: inputPassword })
    });

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('Erro ao processar JSON:', jsonError);
      alert('Erro inesperado. Tente novamente mais tarde.');
      return;
    }

    if (response.ok) {
      alert('Login bem-sucedido!');
      const user = data.user;
      currentEstablishmentId = user.establishmentId;

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('currentEstablishmentId', user.establishmentId);

      // Aplica tema baseado nas configurações do usuário/estabelecimento
      const theme = {
        "primary-color": user["primary-color"],
        "secondary-color": user["secondary-color"],
        "background-color": user["background-color"],
        "container-bg": user["container-bg"],
        "text-color": user["text-color"],
        "header-bg": user["header-bg"],
        "footer-bg": user["footer-bg"],
        "footer-text": user["footer-text"],
        "input-border": user["input-border"],
        "button-bg": user["button-bg"],
        "button-text": user["button-text"],
        "section-margin": user["section-margin"]
      };

      applyTheme(theme);

      const logoElement = document.getElementById('logo');
      if (logoElement) {
        logoElement.src = user.logoURL;
      }

      document.getElementById('loginDiv').style.display = 'none';
      document.getElementById('dashboard').style.display = 'block';
      loadClients();
    } else {
      if (data.message && data.message.includes('Pagamento pendente')) {
        if (confirm(`${data.message}\nDeseja efetuar o pagamento agora?`)) {
          window.location.href = "https://mpago.la/1Mc6Lnc";
        }
      } else {
        alert(data.message || 'Usuário ou senha inválidos!');
      }
    }
  } catch (error) {
    console.error('Erro no login:', error);
    alert('Erro no login. Tente novamente.');
  }
});



// No window.onload, depois de loadClients():
renderQRCode();

// E também, dentro do bloco de sucesso do login, depois de loadClients():
renderQRCode();


// Função de Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentEstablishmentId');
  document.getElementById('loginDiv').style.display = 'block';
  document.getElementById('dashboard').style.display = 'none';
  alert('Logout realizado com sucesso!');
});

// Função para Carregar Clientes
async function loadClients() {
  try {
    const response = await fetch(`${API_URL}/clients?establishmentId=${currentEstablishmentId}`);
    const clients = await response.json();
    renderClientsTable(clients);
    displayClients(clients);
  } catch (error) {
    console.error('Erro ao carregar clientes:', error);
  }
}

// Renderiza tabela de clientes
function renderClientsTable(clients) {
  const tableBody = document.getElementById('clientTableBody');
  let rows = '';
  clients.forEach(client => {
    rows += `
      <tr>
        <td>${client.fullName}</td>
        <td>${client.email || ''}</td>
        <td>${client.phone}</td>
        <td>${client.points}</td>
        <td id="acoes">
          <button onclick="editClient('${client.id}')">Editar</button>
          <button onclick="deleteClient('${client.id}')">Excluir</button>
        </td>
      </tr>
    `;
  });
  tableBody.innerHTML = rows;
}

// Renderiza QR Code e link para pontos
function renderQRCode() {
  const qrImg = document.getElementById('qrCodeImg');
  const link  = document.getElementById('pointsLink');
  qrImg.src   = `${API_URL}/establishments/${currentEstablishmentId}/qrcode`;
  link.href   = `${BASE_URL}/points.html?establishmentId=${currentEstablishmentId}`;
}

// No window.onload e após login bem‑sucedido:
renderQRCode();


// Adiciona novo cliente
async function addClient() {
  const clientFullName = document.getElementById('clientFullName').value;
  const clientPhone = document.getElementById('clientPhone').value;
  const clientEmail = document.getElementById('clientEmail').value;
  const clientPoints = parseInt(document.getElementById('clientPoints').value) || 0;

  if (!clientFullName || !clientPhone) {
    alert('Por favor, preencha os campos obrigatórios: Nome e Telefone.');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        fullName: clientFullName, 
        phone: clientPhone, 
        email: clientEmail, 
        points: clientPoints, 
        establishmentId: currentEstablishmentId 
      })
    });
    const data = await response.json();
    if (response.ok) {
      alert('Cliente salvo com sucesso!');
      loadClients();
      document.getElementById('clientFullName').value = '';
      document.getElementById('clientPhone').value = '';
      document.getElementById('clientEmail').value = '';
      document.getElementById('clientPoints').value = '';
    } else {
      alert(data.message || 'Erro ao salvar cliente');
    }
  } catch (error) {
    console.error('Erro ao salvar cliente:', error);
    alert('Erro ao salvar cliente');
  }
}

// Listener para salvar cliente (add ou update)
document.getElementById('saveClientBtn').addEventListener('click', async () => {
  if (isEditing) {
    const updatedFullName = document.getElementById('clientFullName').value;
    const updatedPhone = document.getElementById('clientPhone').value;
    const updatedEmail = document.getElementById('clientEmail').value;
    const updatedPoints = parseInt(document.getElementById('clientPoints').value) || 0;

    if (!updatedFullName || !updatedPhone) {
      alert('Por favor, preencha os campos obrigatórios: Nome e Telefone.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/clients/${editingClientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fullName: updatedFullName, 
          phone: updatedPhone, 
          email: updatedEmail,
          points: updatedPoints,
          establishmentId: currentEstablishmentId 
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Cliente atualizado com sucesso!');
        isEditing = false;
        editingClientId = null;
        document.getElementById('saveClientBtn').textContent = "Salvar Cliente";
        loadClients();
        document.getElementById('clientFullName').value = '';
        document.getElementById('clientPhone').value = '';
        document.getElementById('clientEmail').value = '';
        document.getElementById('clientPoints').value = '';
      } else {
        alert(data.message || 'Erro ao atualizar cliente');
      }
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      alert('Erro ao atualizar cliente');
    }
  } else {
    addClient();
  }
});

// Editar cliente
async function editClient(clientId) {
  try {
    const response = await fetch(`${API_URL}/clients?establishmentId=${currentEstablishmentId}`);
    const clients = await response.json();
    const client = clients.find(c => c.id == clientId);
    if (!client) {
      alert('Cliente não encontrado!');
      return;
    }
    document.getElementById('clientFullName').value = client.fullName;
    document.getElementById('clientPhone').value = client.phone;
    document.getElementById('clientEmail').value = client.email || '';
    document.getElementById('clientPoints').value = client.points;

    isEditing = true;
    editingClientId = clientId;
    document.getElementById('saveClientBtn').textContent = "Atualizar Cliente";
  } catch (error) {
    console.error('Erro:', error);
  }
}

// Excluir cliente
async function deleteClient(clientId) {
  if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
  try {
    const response = await fetch(`${API_URL}/clients/${clientId}?establishmentId=${currentEstablishmentId}`, { 
      method: 'DELETE' 
    });
    const data = await response.json();
    if (response.ok) {
      alert('Cliente excluído com sucesso!');
      loadClients();
    } else {
      alert(data.message || 'Erro ao excluir cliente');
    }
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    alert('Erro ao excluir cliente');
  }
}

// Buscar clientes e preencher select
document.getElementById('searchBtn').addEventListener('click', async () => {
  const searchTerm = document.getElementById('searchClient').value.toLowerCase();
  try {
    const response = await fetch(`${API_URL}/clients?establishmentId=${currentEstablishmentId}`);
    const clients = await response.json();
    const filteredClients = clients.filter(client => 
      client.fullName && client.fullName.toLowerCase().includes(searchTerm)
    );
    const clientSelect = document.getElementById('clientSelect');
    clientSelect.innerHTML = '<option value="">Selecione o cliente</option>';
    filteredClients.forEach(client => {
      const option = document.createElement('option');
      option.value = client.id;
      option.textContent = client.fullName;
      clientSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
  }
});

// Adicionar pontos a um cliente
document.getElementById('addPointsBtn').addEventListener('click', async () => {
  const clientId = document.getElementById('clientSelect').value;
  const pointsToAdd = parseInt(document.getElementById('points').value);
  if (!clientId || !pointsToAdd) {
    alert('Selecione um cliente e informe os pontos!');
    return;
  }
  try {
    const response = await fetch(`${API_URL}/clients/${clientId}/points`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pointsToAdd, establishmentId: currentEstablishmentId })
    });
    const data = await response.json();
    if (response.ok) {
      alert('Pontos adicionados com sucesso!');
      loadClients();
    } else {
      alert(data.message || 'Erro ao adicionar pontos');
    }
  } catch (error) {
    console.error('Erro ao adicionar pontos:', error);
    alert('Erro ao adicionar pontos');
  }
});

// Exibe clientes com 10 ou mais pontos
function displayClients(clients) {
  const clientList = document.getElementById("clients");
  clientList.innerHTML = "";
  const filteredClients = clients.filter(client => client.points >= 10);
  filteredClients.forEach(client => {
    const listItem = document.createElement("li");
    listItem.textContent = `${client.fullName} - Pontos: ${client.points || 0}`;
    const whatsappButton = document.createElement("button");
    whatsappButton.textContent = "Enviar Voucher";
    whatsappButton.addEventListener("click", () => sendVoucher(client.id));
    listItem.appendChild(whatsappButton);
    clientList.appendChild(listItem);
  });
}

// Envia voucher via WhatsApp e reseta pontos
async function sendVoucher(clienteId) {
  try {
    const response = await fetch(`${API_URL}/voucher/${clienteId}`);
    const data = await response.json();
    if (data.error) {
      alert("Erro ao buscar o voucher: " + data.error);
      return;
    }
    const numeroCliente = data.numero;
    const mensagem = encodeURIComponent(data.mensagem);
    const linkWhatsApp = `https://wa.me/${numeroCliente}?text=${mensagem}`;
    window.open(linkWhatsApp, "_blank");
    await resetClientPoints(clienteId);
  } catch (error) {
    console.error("Erro ao enviar voucher:", error);
    alert("Erro ao enviar voucher.");
  }
}

// Reseta os pontos do cliente
async function resetClientPoints(clienteId) {
  try {
    const response = await fetch(`${API_URL}/clients/${clienteId}/reset`, {
      method: "PUT",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ establishmentId: currentEstablishmentId })
    });
    if (!response.ok) {
      throw new Error("Erro ao resetar os pontos do cliente");
    }
    const data = await response.json();
    alert(data.message);
    loadClients();
  } catch (error) {
    console.error("Erro ao resetar pontos:", error);
    alert("Erro ao resetar os pontos.");
  }
}
