// admin.js
const API = '/api/admin/establishments';
const token = localStorage.getItem('authToken');

// === Helpers ===
function isValidHexColor(color) {
  return typeof color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(color);
}
function safeHex(color, fallback = '#000000') {
  return isValidHexColor(color) ? color : fallback;
}
function safeNumber(value, fallback = 0) {
  const num = parseInt(value, 10);
  return !isNaN(num) ? num : fallback;
}

// Aplica tema via variáveis CSS
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

  tbody.innerHTML = list.map(e => {
    const cols = {
      id: e.id,
      name: e.name,
      lastPaymentDate: e.lastPaymentDate?.substring(0,10) || '',
      primaryColor:   safeHex(e.primaryColor),
      secondaryColor: safeHex(e.secondaryColor),
      backgroundColor:safeHex(e.backgroundColor),
      containerBg:    safeHex(e.containerBg),
      textColor:      safeHex(e.textColor),
      headerBg:       safeHex(e.headerBg),
      footerBg:       safeHex(e.footerBg),
      footerText:     safeHex(e.footerText),
      inputBorder:    safeHex(e.inputBorder),
      buttonBg:       safeHex(e.buttonBg),
      buttonText:     safeHex(e.buttonText),
      sectionMargin:  safeNumber(e.sectionMargin),
      logoURL:        e.logoURL || ''
    };
    return `
    <tr data-id="${cols.id}">
      <td>${cols.id}</td>
      <td>${cols.name}</td>
      <td><input type="date" class="payDate" value="${cols.lastPaymentDate}"></td>
      <td class="theme-cell">
        <div class="color-inputs">
          <label>Primária <input type="color" class="primaryColor" value="${cols.primaryColor}"></label>
          <label>Secundária <input type="color" class="secondaryColor" value="${cols.secondaryColor}"></label>
          <label>Fundo <input type="color" class="backgroundColor" value="${cols.backgroundColor}"></label>
          <label>Container <input type="color" class="containerBg" value="${cols.containerBg}"></label>
          <label>Texto <input type="color" class="textColor" value="${cols.textColor}"></label>
          <label>Header <input type="color" class="headerBg" value="${cols.headerBg}"></label>
          <label>Footer Bg <input type="color" class="footerBg" value="${cols.footerBg}"></label>
          <label>Footer Txt <input type="color" class="footerText" value="${cols.footerText}"></label>
          <label>Input Bdr <input type="color" class="inputBorder" value="${cols.inputBorder}"></label>
          <label>Button Bg <input type="color" class="buttonBg" value="${cols.buttonBg}"></label>
          <label>Button Txt <input type="color" class="buttonText" value="${cols.buttonText}"></label>
          <label>Margin <input type="number" class="sectionMargin" value="${cols.sectionMargin}" step="1"></label>
          <label>Logo URL <input type="text" class="logoURL" value="${cols.logoURL}"></label>
        </div>
      </td>
      <td>
        <button class="saveBtn">Salvar</button>
        <button class="delBtn">Excluir</button>
      </td>
    </tr>
    `;
  }).join('');

  // Salvamento com keys camelCase para combinar com backend
  document.querySelectorAll('.saveBtn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const row = btn.closest('tr');
      const id = row.dataset.id;
      const body = {
        lastPaymentDate: row.querySelector('.payDate').value,
        primaryColor:    row.querySelector('.primaryColor').value,
        secondaryColor:  row.querySelector('.secondaryColor').value,
        backgroundColor: row.querySelector('.backgroundColor').value,
        containerBg:     row.querySelector('.containerBg').value,
        textColor:       row.querySelector('.textColor').value,
        headerBg:        row.querySelector('.headerBg').value,
        footerBg:        row.querySelector('.footerBg').value,
        footerText:      row.querySelector('.footerText').value,
        inputBorder:     row.querySelector('.inputBorder').value,
        buttonBg:        row.querySelector('.buttonBg').value,
        buttonText:      row.querySelector('.buttonText').value,
        sectionMargin:   safeNumber(row.querySelector('.sectionMargin').value),
        logoURL:         row.querySelector('.logoURL').value
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

  // Exclusão
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