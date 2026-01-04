// table.js — tabela genérica (UI pura)
// Responsabilidade: renderizar colunas/linhas + ações por linha (edit/delete/view...)

window.Table = (function () {
  function render({ columns = [], rows = [], emptyText = "Sem dados", rowIdKey = "id" } = {}) {
    const wrap = document.createElement("div");
    wrap.className = "c-table";

    const table = document.createElement("table");
    table.className = "c-table__table";

    table.innerHTML = `
      <thead class="c-table__head"></thead>
      <tbody class="c-table__body"></tbody>
    `;

    const thead = table.querySelector(".c-table__head");
    const tbody = table.querySelector(".c-table__body");

    // header
    const trh = document.createElement("tr");
    columns.forEach((col) => {
      const th = document.createElement("th");
      th.textContent = col.label ?? col.key;
      if (col.width) th.style.width = col.width;
      trh.appendChild(th);
    });
    thead.appendChild(trh);

    // body
    if (!rows.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = Math.max(columns.length, 1);
      td.className = "c-table__empty";
      td.textContent = emptyText;
      tr.appendChild(td);
      tbody.appendChild(tr);
    } else {
      rows.forEach((row) => {
        const tr = document.createElement("tr");
        tr.className = "c-table__row";
        tr.setAttribute("data-row-id", row?.[rowIdKey] ?? "");

        columns.forEach((col) => {
          const td = document.createElement("td");

          // render customizado
          if (typeof col.render === "function") {
            const out = col.render(row);
            if (out instanceof Node) td.appendChild(out);
            else td.textContent = String(out ?? "");
          } else {
            td.textContent = String(row?.[col.key] ?? "");
          }

          tr.appendChild(td);
        });

        tbody.appendChild(tr);
      });
    }

    wrap.appendChild(table);
    return wrap;
  }

  // helpers para botões de ação dentro de células
  function actionButton({ label, action, variant = "default" } = {}) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `c-btn c-btn--${variant}`;
    btn.textContent = label ?? "Ação";
    btn.setAttribute("data-action", action ?? "action");
    return btn;
  }

  return { render, actionButton };
})();
