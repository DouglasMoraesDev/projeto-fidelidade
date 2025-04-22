const API = '/api/admin/establishments';
const token = localStorage.getItem('authToken');

async function load() {
  const res = await fetch(API, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const list = await res.json();
  const tbody = document.getElementById('adminTable');
  tbody.innerHTML = list.map(e => `
    <tr data-id="${e.id}">
      <td>${e.id}</td>
      <td>${e.name}</td>
      <td>
        <input type="date" class="payDate" value="${e.lastPaymentDate?.substring(0,10) || ''}">
      </td>
      <td>
        <input type="color" class="primaryColor" value="${e.primaryColor}">
        <input type="color" class="secondaryColor" value="${e.secondaryColor}">
        <!-- adicione outros inputs de cor/configuração aqui -->
      </td>
      <td>
        <button class="saveBtn">Salvar</button>
        <button class="delBtn">Excluir</button>
      </td>
    </tr>
  `).join('');

  // adiciona listeners
  document.querySelectorAll('.saveBtn').forEach(btn => {
    btn.onclick = async () => {
      const row = btn.closest('tr');
      const id = row.dataset.id;
      const body = {
        lastPaymentDate: row.querySelector('.payDate').value,
        primaryColor:    row.querySelector('.primaryColor').value,
        secondaryColor:  row.querySelector('.secondaryColor').value,
        // … outros campos
      };
      await fetch(`${API}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type':'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      alert('Atualizado com sucesso!');
    };
  });
  document.querySelectorAll('.delBtn').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('Confirma exclusão?')) return;
      const row = btn.closest('tr');
      const id = row.dataset.id;
      await fetch(`${API}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      row.remove();
    };
  });
}

load();
