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

// Aplica tema via variáveis CSS
function applyTheme(vars) {
  Object.entries(vars).forEach(([key, val]) => {
    document.documentElement.style.setProperty(`--${key}`, val);
  });
}

// Início: Carrega tema salvo do localStorage
const savedTheme = JSON.parse(localStorage.getItem('adminTheme') || '{}');
applyTheme(savedTheme);
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
    const dateVal = e.lastPaymentDate ? e.lastPaymentDate.substring(0,10) : '';
    return `
      <tr data-id="${e.id}">
        <td>${e.id}</td>
        <td>${e.name}</td>
        <td><input type="date" class="payDate" value="${dateVal}"></td>
        <td class="theme-cell">
          <div class="color-inputs">
            <label>Primária <input type="color" class="primaryColor"     value="${safeHex(e.primaryColor)}"></label>
            <label>Secundária <input type="color" class="secondaryColor" value="${safeHex(e.secondaryColor)}"></label>
            <label>Fundo <input type="color" class="backgroundColor"    value="${safeHex(e.backgroundColor)}"></label>
            <label>Container <input type="color" class="containerBg"     value="${safeHex(e.containerBg)}"></label>
            <label>Texto <input type="color" class="textColor"          value="${safeHex(e.textColor)}"></label>
            <label>Header <input type="color" class="headerBg"          value="${safeHex(e.headerBg)}"></label>
            <label>Footer Bg <input type="color" class="footerBg"       value="${safeHex(e.footerBg)}"></label>
            <label>Footer Txt <input type="color" class="footerText"    value="${safeHex(e.footerText)}"></label>
            <label>Input Bdr <input type="color" class="inputBorder"    value="${safeHex(e.inputBorder)}"></label>
            <label>Button Bg <input type="color" class="buttonBg"      value="${safeHex(e.buttonBg)}"></label>
            <label>Button Txt <input type="color" class="buttonText"    value="${safeHex(e.buttonText)}"></label>
            <label>Margin <input type="text" class="sectionMargin"     value="${e.sectionMargin}"></label>
            <label>Logo URL <input type="text" class="logoURL"         value="${e.logoURL || ''}"></label>
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

      // Converte date para ISO completo
      const rawDate = row.querySelector('.payDate').value;          
      const lastPaymentDate = rawDate
        ? new Date(rawDate + 'T00:00:00').toISOString()
        : null;

      const body = {
        lastPaymentDate,
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
        sectionMargin:   row.querySelector('.sectionMargin').value,
        logoURL:         row.querySelector('.logoURL').value
      };

      const res = await fetch(`${API}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert('Erro ao atualizar: ' + (err.message || res.status));
        return;
      }

      alert('Estabelecimento atualizado com sucesso!');
      load();
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