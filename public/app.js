// public/app.js

// Define a URL base da API já com o prefixo /api
const API_URL = 'https://projeto-fidelidade-production.up.railway.app/api';

// Variável global para armazenar o establishmentId do usuário logado
let currentEstablishmentId = null;

// Verifica se o usuário está logado ao carregar a página
window.onload = function() {
  const storedToken = localStorage.getItem('authToken');
  const storedEstablishmentId = localStorage.getItem('currentEstablishmentId');

  // Se não estiver logado, mostra a tela de login
  if (!storedToken || !storedEstablishmentId) {
    document.getElementById('loginDiv').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    return;
  }

  // Se já estiver logado, busca as configurações do estabelecimento e aplica o tema
  currentEstablishmentId = storedEstablishmentId;
  loadEstablishmentTheme(); // Carregar o tema diretamente da API
  loadClients();  // Carregar clientes após aplicar o tema
  document.getElementById('loginDiv').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
};

/**
 * Aplica as configurações de tema atualizando as variáveis CSS.
 * @param {Object} theme - Objeto contendo as configurações de tema.
 */
function applyTheme(theme) {
  Object.entries(theme).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--${key}`, value);
  });
}

// Função para buscar o tema do estabelecimento na API e aplicar as cores
async function loadEstablishmentTheme() {
  try {
    const response = await fetch(`${API_URL}/establishments/${currentEstablishmentId}`);
    
    // Logar a resposta para debug
    const data = await response.json();
    console.log('Resposta da API para o tema:', data);
    
    // Verifique se a resposta está OK
    if (response.ok) {
      if (!data.primaryColor || !data.secondaryColor) {
        throw new Error('Cores do tema não encontradas na resposta da API.');
      }
      
      // Extrai as configurações de tema do estabelecimento
      const theme = {
        "primary-color": data.primaryColor,
        "secondary-color": data.secondaryColor,
        "background-color": data.backgroundColor,
        "container-bg": data.containerBg,
        "text-color": data.textColor,
        "header-bg": data.headerBg,
        "footer-bg": data.footerBg,
        "footer-text": data.footerText,
        "input-border": data.inputBorder,
        "button-bg": data.buttonBg,
        "button-text": data.buttonText,
        "section-margin": data.sectionMargin
      };

      // Aplica as configurações de tema
      applyTheme(theme);

      // Atualiza o logo, se existir um elemento com id "logo"
      const logoElement = document.getElementById('logo');
      if (logoElement) {
        logoElement.src = data.logoURL;
      }
    } else {
      throw new Error(`Erro na resposta da API: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Erro ao carregar o tema do estabelecimento:', error);
    alert('Erro ao carregar o tema do estabelecimento: ' + error.message);
  }
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
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: inputUsername, password: inputPassword })
    });

    let data;
    try {
      data = await response.json(); // Tenta converter a resposta em JSON
    } catch (jsonError) {
      console.error('Erro ao processar JSON:', jsonError);
      alert('Erro inesperado. Tente novamente mais tarde.');
      return;
    }

    if (response.ok) {
      // Login bem-sucedido
      alert('Login bem-sucedido!');
      const user = data.user;
      currentEstablishmentId = user.establishmentId;

      // Salva o token e o establishmentId no localStorage para persistir o login
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('currentEstablishmentId', user.establishmentId);

      // Carregar o tema do estabelecimento diretamente da API
      loadEstablishmentTheme();

      // Alterna para o dashboard
      document.getElementById('loginDiv').style.display = 'none';
      document.getElementById('dashboard').style.display = 'block';
      loadClients();
    } else {
      // Se o erro for de pagamento pendente, sugira o pagamento
      if (data.message && data.message.includes('Pagamento pendente')) {
        if (confirm(`${data.message}\nDeseja efetuar o pagamento agora?`)) {
          // Redireciona para o link do MercadoPago (substitua pelo seu link real)
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

// --- Função de Logout ---
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentEstablishmentId');

  // Redireciona para a tela de login
  document.getElementById('loginDiv').style.display = 'block';
  document.getElementById('dashboard').style.display = 'none';
  alert('Logout realizado com sucesso!');
});


// --- Função para Carregar Clientes ---
async function loadClients() {
  try {
    // Inclui o establishmentId na query string
    const response = await fetch(`${API_URL}/clients?establishmentId=${currentEstablishmentId}`);
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
    const response = await fetch(`${API_URL}/clients?establishmentId=${currentEstablishmentId}`);
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

// --- Função para Buscar Clientes ---
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

// --- Função para Adicionar Pontos a um Cliente ---
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

// --- Função para Exibir Clientes com 10 ou Mais Pontos ---
function displayClients(clients) {
  const clientList = document.getElementById("clients");
  clientList.innerHTML = ""; // Limpa a lista existente

  // Filtra os clientes com 10 ou mais pontos
  const filteredClients = clients.filter(client => client.points >= 10);

  // Exibe apenas os clientes com 10 ou mais pontos
  filteredClients.forEach(client => {
    const listItem = document.createElement("li");
    listItem.textContent = `${client.fullName} - Pontos: ${client.points || 0}`;

    // Adiciona o botão para clientes com 10 ou mais pontos
    const whatsappButton = document.createElement("button");
    whatsappButton.textContent = "Enviar Voucher";

    // Ao clicar, chama a função sendVoucher passando o ID do cliente
    whatsappButton.addEventListener("click", () => sendVoucher(client.id));

    listItem.appendChild(whatsappButton);
    clientList.appendChild(listItem);
  });
}

// --- Função para Enviar o Voucher via WhatsApp e Resetar Pontos ---
async function sendVoucher(clienteId) {
  try {
    const response = await fetch(`/api/voucher/${clienteId}`);
    const data = await response.json();

    if (data.error) {
      alert("Erro ao buscar o voucher: " + data.error);
      return;
    }

    const numeroCliente = data.numero;
    const mensagem = encodeURIComponent(data.mensagem);
    const linkWhatsApp = `https://wa.me/${numeroCliente}?text=${mensagem}`;

    window.open(linkWhatsApp, "_blank");

    // Após abrir o WhatsApp, reseta os pontos do cliente para 0
    await resetClientPoints(clienteId);

  } catch (error) {
    console.error("Erro ao enviar voucher:", error);
    alert("Erro ao enviar voucher.");
  }
}

// --- Função para Resetar os Pontos do Cliente ---
async function resetClientPoints(clienteId) {
  try {
    const response = await fetch(`/api/reset-points/${clienteId}`, {
      method: "PUT"
    });

    if (!response.ok) {
      throw new Error("Erro ao resetar os pontos do cliente");
    }

    alert("Voucher enviado e pontos resetados com sucesso!");

    const data = await response.json();
    alert(data.message);

    if (data.reload) {
      window.location.reload();
    } else {
      loadClients(); // Carrega a lista de clientes novamente sem recarregar a página
    }

  } catch (error) {
    console.error("Erro ao resetar pontos:", error);
    alert("Erro ao resetar os pontos.");
  }
}
