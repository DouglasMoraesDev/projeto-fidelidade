// admin.js
const API = '/api/admin/establishments';
const token = localStorage.getItem('authToken');

// Aplica tema via variáveis CSS (não relacionado ao establishment, mas mantido)
function applyTheme(vars) {
  for (let key in vars) {
    document.documentElement.style.setProperty(`--${key}`, vars[key]);
  }
}

// Carrega tema salvo do localStorage
const savedTheme = JSON.parse(localStorage.getItem('adminTheme') || '{}');
applyTheme(savedTheme);

// Inicializa os color pickers do painel de tema
['bg','text','primary','secondary'].forEach(name => {
  const picker = document.getElementById(`${name}Picker`);
  const varName = `${name}-color`;
  if (savedTheme[varName]) picker.value = savedTheme[varName];
  picker.addEventListener('input', () => {
    const value = picker.value;
    applyTheme({ [varName]: value });
    const theme = JSON.parse(localStorage.getItem('adminTheme') || '{}');
    theme[varName] = value;
    localStorage.setItem('adminTheme', JSON.stringify(theme));
  });
});

// Carrega e renderiza lista de establishments
async function load() {
  const res = await fetch(API, { headers: { 'Authorization': `Bearer ${token}` } });
  const list = await res.json();
  const tbody = document.getElementById('adminTable');

  // Monta linhas com campos editáveis para todas as propriedades
  tbody.innerHTML = list.map(e => `
    <tr data-id="${e.id}">
      <td>${e.id}</td>
      <td>${e.name}</td>
      <td><input type="date" class="payDate" value="${e.lastPaymentDate?.substring(0,10)||''}"></td>
      <td class="theme-cell">
        <div class="color-inputs">
          <label>Primária <input type="color" class="primaryColor" value="${e.primaryColor}"></label>
          <label>Secundária <input type="color" class="secondaryColor" value="${e.secondaryColor}"></label>
          <label>Fundo <input type="color" class="backgroundColor" value="${e.backgroundColor}"></label>
          <label>Container <input type="color" class="containerBg" value="${e.containerBg}"></label>
          <label>Texto <input type="color" class="textColor" value="${e.textColor}"></label>
          <label>Header <input type="color" class="headerBg" value="${e.headerBg}"></label>
          <label>Footer Bg <input type="color" class="footerBg" value="${e.footerBg}"></label>
          <label>Footer Txt <input type="color" class="footerText" value="${e.footerText}"></label>
          <label>Input Border <input type="color" class="inputBorder" value="${e.inputBorder}"></label>
          <label>Button Bg <input type="color" class="buttonBg" value="${e.buttonBg}"></label>
          <label>Button Txt <input type="color" class="buttonText" value="${e.buttonText}"></label>
          <label>Margin <input type="number" class="sectionMargin" value="${e.sectionMargin}" step="1"></label>
          <label>Logo URL <input type="text" class="logoURL" value="${e.logoURL || ''}"></label>
        </div>
      </td>
      <td>
        <button class="saveBtn">Salvar</button>
        <button class="delBtn">Excluir</button>
      </td>
    </tr>
  `).join('');

  // Handler de Salvamento
  document.querySelectorAll('.saveBtn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const row = btn.closest('tr');
      const id = row.dataset.id;
      const body = {
        lastPaymentDate: row.querySelector('.payDate').value,
        'primary-color':    row.querySelector('.primaryColor').value,
        'secondary-color':  row.querySelector('.secondaryColor').value,
        'background-color': row.querySelector('.backgroundColor').value,
        'container-bg':     row.querySelector('.containerBg').value,
        'text-color':       row.querySelector('.textColor').value,
        'header-bg':        row.querySelector('.headerBg').value,
        'footer-bg':        row.querySelector('.footerBg').value,
        'footer-text':      row.querySelector('.footerText').value,
        'input-border':     row.querySelector('.inputBorder').value,
        'button-bg':        row.querySelector('.buttonBg').value,
        'button-text':      row.querySelector('.buttonText').value,
        'section-margin':   row.querySelector('.sectionMargin').value,
        logoURL:            row.querySelector('.logoURL').value
      };
      await fetch(`${API}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      alert('Estabelecimento atualizado com sucesso!');
    });
  });

  // Handler de Exclusão
  document.querySelectorAll('.delBtn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Confirma exclusão?')) return;
      const row = btn.closest('tr');
      const id = row.dataset.id;
      await fetch(`${API}/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      row.remove();
    });
  });
}

load();

