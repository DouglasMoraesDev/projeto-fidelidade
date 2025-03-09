// public/app.js

// Define a URL base da API já com o prefixo /api
const apiBaseUrl = 'http://localhost:3000/api';

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

// --- Função de Login ---
document.getElementById('loginBtn').addEventListener('click', async () => {
  const inputUsername = document.getElementById('username').value;
  const inputPassword = document.getElementById('password').value;

  if (!inputUsername || !inputPassword) {
    alert('Por favor, preencha todos os campos!');
    return;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: inputUsername, password: inputPassword })
    });
    const data = await response.json();
    if (response.ok) {
      alert('Login bem-sucedido!');
      // Extrai os dados do usuário e armazena o establishmentId globalmente
      const user = data.user;
      currentEstablishmentId = user.establishmentId;

      // Cria o objeto de tema com as configurações vindas do Establishment
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

      // Aplica as configurações do tema
      applyTheme(theme);

      // Atualiza o logo, se existir um elemento com id "logo"
      const logoElement = document.getElementById('logo');
      if (logoElement) {
        logoElement.src = user.logoURL;
      }

      // Alterna para o dashboard
      document.getElementById('loginDiv').style.display = 'none';
      document.getElementById('dashboard').style.display = 'block';
      loadClients();
    } else {
      alert(data.message || 'Usuário ou senha inválidos!');
    }
  } catch (error) {
    console.error('Erro no login:', error);
    alert('Erro no login');
  }
});

// --- Função para Carregar Clientes ---
async function loadClients() {
  try {
    // Inclui o establishmentId na query string
    const response = await fetch(`${apiBaseUrl}/clients?establishmentId=${currentEstablishmentId}`);
    const clients = await response.json();
    console.log('Clientes carregados:', clients);
    renderClientsTable(clients);
    displayClients(clients);
  } catch (error) {
    console.error('Erro ao carregar clientes:', error);
  }
}

// --- Função para Renderizar Tabela de Clientes ---
function renderClientsTable(clients) {
  const clientTable = document.getElementById('clientTable');
  let tableContent = '<table><tr><th>Nome Completo</th><th>Email</th><th>Telefone</th><th>Pontos</th><th>Ações</th></tr>';
  clients.forEach(client => {
    tableContent += `
      <tr>
        <td>${client.fullName}</td>
        <td>${client.email || ''}</td>
        <td>${client.phone}</td>
        <td>${client.points}</td>
        <td>
          <button onclick="editClient('${client.id}')">Editar</button>
          <button onclick="deleteClient('${client.id}')">Excluir</button>
        </td>
      </tr>
    `;
  });
  tableContent += '</table>';
  clientTable.innerHTML = tableContent;
}

// --- Função para Adicionar Novo Cliente ---
async function addClient() {
  const clientFullName = document.getElementById('clientFullName').value;
  const clientPhone = document.getElementById('clientPhone').value;
  const clientEmail = document.getElementById('clientEmail').value; // Opcional
  const clientPoints = parseInt(document.getElementById('clientPoints').value) || 0;

  // Validação: apenas nome e telefone são obrigatórios
  if (!clientFullName || !clientPhone) {
    alert('Por favor, preencha os campos obrigatórios: Nome e Telefone.');
    return;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/clients`, {
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
      // Opcional: limpar os campos do formulário
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

// Listener único para o botão de salvar cliente, utilizando controle de estado
document.getElementById('saveClientBtn').addEventListener('click', async () => {
  if (isEditing) {
    // Modo de atualização
    const updatedFullName = document.getElementById('clientFullName').value;
    const updatedPhone = document.getElementById('clientPhone').value;
    const updatedEmail = document.getElementById('clientEmail').value;
    const updatedPoints = parseInt(document.getElementById('clientPoints').value) || 0;
    
    // Validação: apenas nome e telefone são obrigatórios
    if (!updatedFullName || !updatedPhone) {
      alert('Por favor, preencha os campos obrigatórios: Nome e Telefone.');
      return;
    }
    
    try {
      const res = await fetch(`${apiBaseUrl}/clients/${editingClientId}`, {
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
        // Reseta o estado de edição
        isEditing = false;
        editingClientId = null;
        document.getElementById('saveClientBtn').textContent = "Salvar Cliente";
        loadClients();
        // Opcional: limpar os campos do formulário
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
    // Modo de adicionar cliente
    addClient();
  }
});

// --- Função para Editar Cliente ---
async function editClient(clientId) {
  try {
    const response = await fetch(`${apiBaseUrl}/clients?establishmentId=${currentEstablishmentId}`);
    const clients = await response.json();
    const client = clients.find(c => c.id == clientId);
    if (!client) {
      alert('Cliente não encontrado!');
      return;
    }
    // Preenche os campos com os dados do cliente (email pode estar vazio)
    document.getElementById('clientFullName').value = client.fullName;
    document.getElementById('clientPhone').value = client.phone;
    document.getElementById('clientEmail').value = client.email || '';
    document.getElementById('clientPoints').value = client.points;
    
    // Muda o estado para edição
    isEditing = true;
    editingClientId = clientId;
    document.getElementById('saveClientBtn').textContent = "Atualizar Cliente";
  } catch (error) {
    console.error('Erro:', error);
  }
}

// --- Função para Excluir Cliente ---
async function deleteClient(clientId) {
  if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
  try {
    const response = await fetch(`${apiBaseUrl}/clients/${clientId}?establishmentId=${currentEstablishmentId}`, { 
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

// --- Função para Buscar Clientes ---
document.getElementById('searchBtn').addEventListener('click', async () => {
  const searchTerm = document.getElementById('searchClient').value.toLowerCase();
  try {
    const response = await fetch(`${apiBaseUrl}/clients?establishmentId=${currentEstablishmentId}`);
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

// --- Função para Adicionar Pontos a um Cliente ---
document.getElementById('addPointsBtn').addEventListener('click', async () => {
  const clientId = document.getElementById('clientSelect').value;
  const pointsToAdd = parseInt(document.getElementById('points').value);
  if (!clientId || !pointsToAdd) {
    alert('Selecione um cliente e informe os pontos!');
    return;
  }
  try {
    const response = await fetch(`${apiBaseUrl}/clients/${clientId}/points`, {
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

// --- Função para Resetar (Excluir) Todos os Clientes ---
document.getElementById('resetClientsBtn').addEventListener('click', async () => {
  if (!confirm('Tem certeza que deseja remover todos os clientes?')) return;
  try {
    const response = await fetch(`${apiBaseUrl}/clients?establishmentId=${currentEstablishmentId}`, { method: 'DELETE' });
    const data = await response.json();
    if (response.ok) {
      alert('Todos os clientes foram removidos!');
      loadClients();
    } else {
      alert(data.message || 'Erro ao remover clientes');
    }
  } catch (error) {
    console.error('Erro ao remover clientes:', error);
    alert('Erro ao remover clientes');
  }
});

// --- Função para Exibir Clientes com 10 ou Mais Pontos ---
function displayClients(clients) {
  const clientList = document.getElementById('clients');
  clientList.innerHTML = '';
  clients.forEach(client => {
    const listItem = document.createElement('li');
    listItem.textContent = `${client.fullName} - Pontos: ${client.points || 0}`;
    if (client.points >= 10) {
      const whatsappButton = document.createElement('button');
      whatsappButton.textContent = 'Enviar Voucher';
      // Ao clicar, chama a função sendVoucher passando o objeto cliente
      whatsappButton.addEventListener('click', () => sendVoucher(client));
      listItem.appendChild(whatsappButton);
    }
    clientList.appendChild(listItem);
  });
}

// --- Função para Enviar Voucher via WhatsApp e Resetar Pontos no Banco de Dados ---
// Esta função é chamada quando o cliente tem 10 ou mais pontos e clica no botão "Enviar Voucher".
async function sendVoucher(client) {
  try {
    console.log(`Enviando voucher para: ${client.fullName}, ID do estabelecimento: ${client.establishmentId}`);

    // Chama o endpoint único que envia voucher e reseta os pontos
    const response = await fetch(`${apiBaseUrl}/clients/${client.id}/send-voucher`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ establishmentId: currentEstablishmentId })
    });

    if (!response.ok) {
      throw new Error('Erro ao enviar voucher e resetar pontos do cliente.');
    }
    const data = await response.json();
    console.log(data.message);

    // Abre o WhatsApp com a mensagem do voucher
    const encodedMessage = encodeURIComponent(data.voucherMessage);
    const whatsappUrl = `https://wa.me/${client.phone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');

    alert('Voucher enviado e pontos zerados com sucesso!');
    loadClients(); // Atualiza a lista de clientes
  } catch (error) {
    console.error('Erro ao enviar voucher:', error);
    alert('Erro ao enviar voucher');
  }
}
