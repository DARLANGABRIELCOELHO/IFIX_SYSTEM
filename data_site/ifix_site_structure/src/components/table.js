// table.js — tabela genérica melhorada
window.Table = (function () {
  let currentSort = { key: null, direction: "asc" };
  
  function render({ 
    columns = [], 
    rows = [], 
    emptyText = "Nenhum dado encontrado",
    emptyIcon = "📭",
    rowIdKey = "id",
    selectable = false,
    sortable = false,
    onRowClick = null,
    onSort = null,
    actions = [],
    pagination = null,
    loading = false
  } = {}) {
    const wrap = document.createElement("div");
    wrap.className = "c-table";
    
    if (loading) {
      wrap.innerHTML = `
        <div class="c-table__loading">
          <div class="c-table__spinner"></div>
          <div>Carregando...</div>
        </div>
      `;
      return wrap;
    }

    const table = document.createElement("table");
    table.className = "c-table__table";
    table.setAttribute("role", "grid");

    // Cabeçalho
    const thead = document.createElement("thead");
    thead.className = "c-table__head";
    
    const trh = document.createElement("tr");
    trh.setAttribute("role", "row");
    
    // Coluna de seleção
    if (selectable) {
      const th = document.createElement("th");
      th.setAttribute("role", "columnheader");
      th.style.width = "40px";
      
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "c-table__select-all";
      checkbox.setAttribute("aria-label", "Selecionar todas as linhas");
      checkbox.addEventListener("change", toggleSelectAll);
      
      th.appendChild(checkbox);
      trh.appendChild(th);
    }
    
    // Colunas normais
    columns.forEach((col) => {
      const th = document.createElement("th");
      th.setAttribute("role", "columnheader");
      th.setAttribute("scope", "col");
      
      if (col.width) th.style.width = col.width;
      if (col.align) th.style.textAlign = col.align;
      
      const content = document.createElement("div");
      content.className = "c-table__header-content";
      
      const text = document.createElement("span");
      text.textContent = col.label ?? col.key;
      content.appendChild(text);
      
      // Ícone de ordenação
      if (sortable && col.sortable !== false) {
        const sortIcon = document.createElement("span");
        sortIcon.className = "c-table__sort-icon";
        sortIcon.innerHTML = "↕";
        sortIcon.setAttribute("data-sort-key", col.key);
        
        if (currentSort.key === col.key) {
          sortIcon.textContent = currentSort.direction === "asc" ? "↑" : "↓";
          sortIcon.classList.add("is-active");
        }
        
        content.appendChild(sortIcon);
        
        th.addEventListener("click", () => {
          if (typeof onSort === "function") {
            const direction = currentSort.key === col.key && currentSort.direction === "asc" ? "desc" : "asc";
            currentSort = { key: col.key, direction };
            onSort(col.key, direction);
          }
        });
        
        th.style.cursor = "pointer";
      }
      
      th.appendChild(content);
      trh.appendChild(th);
    });
    
    // Coluna de ações
    if (actions.length > 0) {
      const th = document.createElement("th");
      th.setAttribute("role", "columnheader");
      th.textContent = "Ações";
      th.style.width = "120px";
      trh.appendChild(th);
    }
    
    thead.appendChild(trh);
    
    // Corpo
    const tbody = document.createElement("tbody");
    tbody.className = "c-table__body";
    
    if (!rows.length) {
      const tr = document.createElement("tr");
      tr.className = "c-table__empty-row";
      
      const td = document.createElement("td");
      td.colSpan = columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0);
      td.className = "c-table__empty-cell";
      
      td.innerHTML = `
        <div class="c-table__empty-content">
          <div class="c-table__empty-icon">${emptyIcon}</div>
          <div class="c-table__empty-text">${emptyText}</div>
        </div>
      `;
      
      tr.appendChild(td);
      tbody.appendChild(tr);
    } else {
      rows.forEach((row, index) => {
        const tr = document.createElement("tr");
        tr.className = "c-table__row";
        tr.setAttribute("role", "row");
        tr.setAttribute("data-row-id", row?.[rowIdKey] ?? index);
        
        if (onRowClick) {
          tr.style.cursor = "pointer";
          tr.addEventListener("click", (e) => {
            if (!e.target.closest(".c-table__actions")) {
              onRowClick(row);
            }
          });
        }
        
        // Checkbox de seleção
        if (selectable) {
          const td = document.createElement("td");
          td.setAttribute("role", "gridcell");
          
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.className = "c-table__row-select";
          checkbox.setAttribute("data-row-id", row?.[rowIdKey] ?? index);
          
          td.appendChild(checkbox);
          tr.appendChild(td);
        }
        
        // Células de dados
        columns.forEach((col) => {
          const td = document.createElement("td");
          td.setAttribute("role", "gridcell");
          if (col.align) td.style.textAlign = col.align;
          
          if (typeof col.render === "function") {
            const content = col.render(row);
            if (content instanceof Node) {
              td.appendChild(content);
            } else {
              td.innerHTML = String(content ?? "");
            }
          } else {
            td.textContent = String(row?.[col.key] ?? "");
          }
          
          tr.appendChild(td);
        });
        
        // Célula de ações
        if (actions.length > 0) {
          const td = document.createElement("td");
          td.className = "c-table__actions";
          td.setAttribute("role", "gridcell");
          
          const container = document.createElement("div");
          container.className = "c-table__actions-container";
          
          actions.forEach(action => {
            if (typeof action.render === "function") {
              const btn = action.render(row);
              if (btn) container.appendChild(btn);
            } else {
              const btn = actionButton({
                label: action.label,
                action: action.action,
                variant: action.variant || "default",
                size: "sm"
              });
              btn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (typeof action.onClick === "function") {
                  action.onClick(row);
                }
              });
              container.appendChild(btn);
            }
          });
          
          td.appendChild(container);
          tr.appendChild(td);
        }
        
        tbody.appendChild(tr);
      });
    }
    
    table.appendChild(thead);
    table.appendChild(tbody);
    wrap.appendChild(table);
    
    // Paginação
    if (pagination) {
      const paginationEl = createPagination(pagination);
      wrap.appendChild(paginationEl);
    }
    
    return wrap;
  }
  
  function toggleSelectAll(e) {
    const table = e.target.closest(".c-table");
    const checkboxes = table.querySelectorAll(".c-table__row-select");
    checkboxes.forEach(cb => cb.checked = e.target.checked);
  }
  
  function createPagination(pagination) {
    const { current, total, pageSize, onChange } = pagination;
    const totalPages = Math.ceil(total / pageSize);
    
    const nav = document.createElement("nav");
    nav.className = "c-table__pagination";
    nav.setAttribute("role", "navigation");
    nav.setAttribute("aria-label", "Paginação");
    
    const ul = document.createElement("ul");
    
    // Botão anterior
    const prevLi = document.createElement("li");
    const prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className = "c-table__page-btn";
    prevBtn.disabled = current === 1;
    prevBtn.innerHTML = "&laquo;";
    prevBtn.setAttribute("aria-label", "Página anterior");
    prevBtn.addEventListener("click", () => onChange(current - 1));
    prevLi.appendChild(prevBtn);
    ul.appendChild(prevLi);
    
    // Páginas
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || 
        i === totalPages || 
        (i >= current - 2 && i <= current + 2)
      ) {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `c-table__page-btn ${i === current ? "is-active" : ""}`;
        btn.textContent = i;
        btn.addEventListener("click", () => onChange(i));
        li.appendChild(btn);
        ul.appendChild(li);
      } else if (
        i === current - 3 || 
        i === current + 3
      ) {
        const li = document.createElement("li");
        li.className = "c-table__page-ellipsis";
        li.textContent = "...";
        ul.appendChild(li);
      }
    }
    
    // Botão próximo
    const nextLi = document.createElement("li");
    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "c-table__page-btn";
    nextBtn.disabled = current === totalPages;
    nextBtn.innerHTML = "&raquo;";
    nextBtn.setAttribute("aria-label", "Próxima página");
    nextBtn.addEventListener("click", () => onChange(current + 1));
    nextLi.appendChild(nextBtn);
    ul.appendChild(nextLi);
    
    nav.appendChild(ul);
    
    // Informações
    const info = document.createElement("div");
    info.className = "c-table__pagination-info";
    info.textContent = `Mostrando ${((current - 1) * pageSize) + 1}-${Math.min(current * pageSize, total)} de ${total}`;
    nav.appendChild(info);
    
    return nav;
  }
  
  function actionButton({ label, action, variant = "default", size = "md" } = {}) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `c-btn c-btn--${variant} c-btn--${size}`;
    btn.textContent = label;
    btn.setAttribute("data-action", action);
    return btn;
  }
  
  function getSelectedRows(tableEl) {
    const checkboxes = tableEl.querySelectorAll(".c-table__row-select:checked");
    return Array.from(checkboxes).map(cb => cb.getAttribute("data-row-id"));
  }
  
  return { 
    render, 
    actionButton,
    getSelectedRows,
    setSort: (key, direction) => { currentSort = { key, direction }; }
  };
})();