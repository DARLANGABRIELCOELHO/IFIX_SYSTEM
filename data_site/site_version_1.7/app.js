function showSection(id) {
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });

  document.getElementById(id).classList.add('active');
}

/* Dados simulados (mock) */
const clientes = [
  {
    nome: "João Silva",
    documento: "123.456.789-00",
    telefone: "(15) 99999-9999",
    data: "01/01/2026"
  }
];

const os = [
  {
    protocolo: "OS-001",
    cliente: "João Silva",
    aparelho: "iPhone 11",
    status: "Em manutenção"
  }
];

/* Render Clientes */
const clientesTabela = document.getElementById("clientesTabela");
clientes.forEach(c => {
  clientesTabela.innerHTML += `
    <tr>
      <td>${c.nome}</td>
      <td>${c.documento}</td>
      <td>${c.telefone}</td>
      <td>${c.data}</td>
      <td><button>Perfil</button></td>
    </tr>
  `;
});

/* Render OS */
const osTabela = document.getElementById("osTabela");
os.forEach(o => {
  osTabela.innerHTML += `
    <tr>
      <td>${o.protocolo}</td>
      <td>${o.cliente}</td>
      <td>${o.aparelho}</td>
      <td>${o.status}</td>
      <td><button>Ver</button></td>
    </tr>
  `;
});
