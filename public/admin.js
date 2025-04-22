// admin.js
const API = '/api/admin/establishments';
const token = localStorage.getItem('authToken');

// === Helpers ===
// Valida strings de cor hex no formato #rrggbb
function isValidHexColor(color) {
  return typeof color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(color);
}
function safeHex(color, fallback = '#000000') {
  return isValidHexColor(color) ? color : fallback;
}
// Faz parsing de inteiros, removendo unidades ou valores inválidos
function safeNumber(value, fallback = 0) {
  const num = parseInt(value, 10);
  return !isNaN(num) ? num : fallback;
}

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

  tbody.innerHTML = list.map(e => {
    // Sanitiza valores antes de usar nos inputs
    const primary       = safeHex(e.primaryColor);
    const secondary     = safeHex(e.secondaryColor);
    const background    = safeHex(e.backgroundColor);
    const containerBg   = safeHex(e.containerBg);
    const textColor     = safeHex(e.textColor);
    const headerBg      = safeHex(e.headerBg);
    const footerBg      = safeHex(e.footerBg);
    const footerText    = safeHex(e.footerText);
    const inputBorder   = safeHex(e.inputBorder);
    const buttonBg      = safeHex(e.buttonBg);
    const buttonText    = safeHex(e.buttonText);
    const sectionMargin = safeNumber(e.sectionMargin);
    const dateVal       = e.lastPaymentDate?.substring(0,10) || '';

    return `
    <tr data-id="${e.id}">
      <td>${e.id}</td>
      <td>${e.name}</td>
      <td><input type="date" class="payDate" value="${dateVal}"></td>
      <td class="theme-cell">
        <div class="color-inputs">
          <label>Primária <input type="color" class="primaryColor"     value="${primary}"></label>
          <label>Secundária <input type="color" class="secondaryColor" value="${secondary}"></label>
          <label>Fundo      <input type="color" class="backgroundColor"  value="${background}"></label>
          <label>Container  <input type="color" class="containerBg"      value="${containerBg}"></label>
          <label>Texto      <input type="color" class="textColor"       value="${textColor}"></label>
          <label>Header     <input type="color" class="headerBg"        value="${headerBg}"></label>
          <label>Footer Bg  <input type="color" class="footerBg"        value="${footerBg}"></label>
          <label>Footer Txt <input type="color" class="footerText"      value="${footerText}"></label>
          <label>Input Bdr  <input type="color" class="inputBorder"     value="${inputBorder}"></label>
          <label>Button Bg  <input type="color" class="buttonBg"        value="${buttonBg}"></label>
          <label>Button Txt <input type="color" class="buttonText"      value="${buttonText}"></label>
          <label>Margin     <input type="number" class="sectionMargin" value="${sectionMargin}" step="1"></label>
          <label>Logo URL   <input type="text"   class="logoURL"      value="${e.logoURL || ''}"></label>
        </div>
      </td>
      <td>
        <button class="saveBtn">Salvar</button>
        <button class="delBtn">Excluir</button>
      </td>
    </tr>
    `;
  }).join('');

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