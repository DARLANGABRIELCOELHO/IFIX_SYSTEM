// dashboard.page.js — Página Dashboard (UI + leitura de dados)
// Responsabilidade: KPIs + lista rápida de OS recentes

window.Pages = window.Pages || {};

window.Pages["dashboard"] = (function () {
  function render() {
    const root = document.createElement("div");
    root.className = "p-dashboard";

    const header = document.createElement("div");
    header.className = "p-pageHeader";
    header.innerHTML = `
      <div class="p-pageHeader__title">Dashboard</div>
      <div class="p-pageHeader__subtitle">Visão geral rápida do fluxo</div>
    `;

    const grid = document.createElement("div");
    grid.className = "p-dashboard__grid";

    // ===== KPIs =====
    const stats = safeStats();
    const kpis = document.createElement("div");
    kpis.className = "p-dashboard__kpis";

    kpis.appendChild(
      Card.render({
        title: "Ordens (total)",
        subtitle: "todas as OS registradas",
        content: `<div class="kpi"><div class="kpi__value">${stats.total}</div><div class="kpi__hint">OS</div></div>`,
      })
    );

    kpis.appendChild(
      Card.render({
        title: "Finalizadas (R$)",
        subtitle: "soma das OS finalizadas",
        content: `<div class="kpi"><div class="kpi__value">${formatBRL(stats.revenue)}</div><div class="kpi__hint">Receita</div></div>`,
      })
    );

    kpis.appendChild(
      Card.render({
        title: "Abertas",
        subtitle: "em andamento no fluxo",
        content: `<div class="kpi"><div class="kpi__value">${stats.byStatus["ABERTA"] ?? 0}</div><div class="kpi__hint">OS</div></div>`,
      })
    );

    kpis.appendChild(
      Card.render({
        title: "Aguardando Peça",
        subtitle: "gargalo comum",
        content: `<div class="kpi"><div class="kpi__value">${stats.byStatus["AGUARDANDO PEÇA"] ?? 0}</div><div class="kpi__hint">OS</div></div>`,
      })
    );

    // ===== Tabela OS recentes =====
    const recent = OSRepo.sortByDate("desc").slice(0, 8);

    const table = Table.render({
      columns: [
        { key: "id", label: "OS" },
        { key: "customerName", label: "Cliente" },
        {
          key: "device",
          label: "Aparelho",
          render: (row) => `${row.deviceBrand || "-"} ${row.deviceModel || ""}`.trim(),
        },
        { key: "status", label: "Status" },
        {
          key: "total",
          label: "Total",
          render: (row) => formatBRL(row.total ?? 0),
        },
      ],
      rows: recent,
      emptyText: "Sem ordens registradas ainda.",
    });

    const recentCard = Card.render({
      title: "Ordens recentes",
      subtitle: "últimas movimentações registradas",
      content: table,
      actions: buildRefreshButton(root),
    });

    grid.appendChild(kpis);
    grid.appendChild(recentCard);

    root.appendChild(header);
    root.appendChild(grid);

    // estilos mínimos da page (opcional; pode mover p/ css)
    injectPageStylesOnce();
    return root;
  }

  function buildRefreshButton(root) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "c-btn";
    btn.textContent = "Atualizar";
    btn.addEventListener("click", () => {
      // re-render simples: substitui o nó raiz
      const parent = root.parentElement;
      if (!parent) return;
      parent.replaceChild(render(), root);
    });
    return btn;
  }

  function safeStats() {
    try {
      return OSRepo.stats();
    } catch {
      return { total: 0, byStatus: {}, revenue: 0 };
    }
  }

  function formatBRL(value) {
    const v = Number(value ?? 0);
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function injectPageStylesOnce() {
    if (document.getElementById("p-dashboard-styles")) return;
    const style = document.createElement("style");
    style.id = "p-dashboard-styles";
    style.textContent = `
      .p-pageHeader { display:flex; flex-direction:column; gap:4px; margin-bottom:12px; }
      .p-pageHeader__title { font-size:20px; font-weight:700; }
      .p-pageHeader__subtitle { opacity:.7; font-size:12px; }

      .p-dashboard__grid { display:grid; grid-template-columns: 1fr; gap:12px; }
      .p-dashboard__kpis { display:grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap:12px; }

      .kpi { display:flex; align-items:baseline; gap:10px; }
      .kpi__value { font-size:22px; font-weight:800; }
      .kpi__hint { opacity:.7; font-size:12px; }

      @media (max-width: 1100px) {
        .p-dashboard__kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
      @media (max-width: 560px) {
        .p-dashboard__kpis { grid-template-columns: 1fr; }
      }
    `;
    document.head.appendChild(style);
  }

  return { render };
})();
