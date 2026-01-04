// src/pages/crm.page.js
// Tela CRM (Clientes) - MVP funcional: listar, buscar, criar/editar, arquivar/restaurar, remover
// Consome: /src/data/crm.repo.js

import { CRMRepo } from "../data/crm.repo.js";

/**
 * Convenção simples:
 * - app.js chama CRMPage.mount({ rootEl }) quando a rota/página for "crm"
 * - rootEl é o container onde a página será renderizada (ex.: document.querySelector("#app"))
 */

export const CRMPage = (() => {
  const state = {
    q: "",
    status: "active", // active | archived | all
    page: 1,
    pageSize: 20,
    sortBy: "updatedAt",
    order: "desc",
    lastList: null,
    editingId: null,
  };

  let root = null;

  function esc(str) {
    return (str ?? "")
      .toString()
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatPhoneDigits(digits) {
    const d = (digits ?? "").toString().replace(/\D/g, "");
    if (!d) return "";
    // Formatação simples BR (não perfeito para todos os casos, mas bom p/ MVP)
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return d;
  }

  function formatDate(ts) {
    if (!ts) return "";
    try {
      return new Date(ts).toLocaleString("pt-BR");
    } catch {
      return "";
    }
  }

  function qs(sel) {
    return root.querySelector(sel);
  }

  function qsa(sel) {
    return Array.from(root.querySelectorAll(sel));
  }

  function openModal() {
    const m = qs("#crmModal");
    if (!m) return;
    m.classList.add("is-open");
    qs("#crmModalBackdrop")?.classList.add("is-open");
  }

  function closeModal() {
    const m = qs("#crmModal");
    if (!m) return;
    m.classList.remove("is-open");
    qs("#crmModalBackdrop")?.classList.remove("is-open");
    clearModalErrors();
  }

  function setModalTitle(title) {
    const el = qs("#crmModalTitle");
    if (el) el.textContent = title;
  }

  function clearModalErrors() {
    const box = qs("#crmModalErrors");
    if (box) {
      box.innerHTML = "";
      box.style.display = "none";
    }
  }

  function showModalErrors(errors) {
    const box = qs("#crmModalErrors");
    if (!box) return;
    box.innerHTML = `<ul>${errors.map(e => `<li>${esc(e)}</li>`).join("")}</ul>`;
    box.style.display = "block";
  }

  function getFormPayload() {
    return {
      name: qs("#f_name")?.value ?? "",
      phone: qs("#f_phone")?.value ?? "",
      email: qs("#f_email")?.value ?? "",
      cpf: qs("#f_cpf")?.value ?? "",
      city: qs("#f_city")?.value ?? "",
      neighborhood: qs("#f_neighborhood")?.value ?? "",
      address: qs("#f_address")?.value ?? "",
      tags: qs("#f_tags")?.value ?? "", // "tag1, tag2"
      notes: qs("#f_notes")?.value ?? "",
      status: qs("#f_status")?.value ?? "active",
    };
  }

  function fillForm(client) {
    qs("#f_name").value = client?.name ?? "";
    qs("#f_phone").value = formatPhoneDigits(client?.phone);
    qs("#f_email").value = client?.email ?? "";
    qs("#f_cpf").value = client?.cpf ?? "";
    qs("#f_city").value = client?.city ?? "";
    qs("#f_neighborhood").value = client?.neighborhood ?? "";
    qs("#f_address").value = client?.address ?? "";
    qs("#f_tags").value = (client?.tags ?? []).join(", ");
    qs("#f_notes").value = client?.notes ?? "";
    qs("#f_status").value = client?.status ?? "active";
  }

  function clearForm() {
    fillForm({
      name: "",
      phone: "",
      email: "",
      cpf: "",
      city: "",
      neighborhood: "",
      address: "",
      tags: [],
      notes: "",
      status: "active",
    });
  }

  async function render() {
    // Layout simples e independente (você pode substituir por componentes depois)
    root.innerHTML = `
      <section class="page crm-page">
        <header class="page-header">
          <div class="page-title">
            <h1>CRM</h1>
            <p class="muted">Clientes cadastrados, busca e manutenção.</p>
          </div>

          <div class="page-actions">
            <button class="btn primary" id="btnNewClient">+ Novo cliente</button>
          </div>
        </header>

        <div class="toolbar">
          <div class="toolbar-left">
            <input class="input" id="searchInput" placeholder="Buscar por nome, telefone, e-mail, tags..." />
            <button class="btn" id="btnSearch">Buscar</button>
            <button class="btn ghost" id="btnClearSearch">Limpar</button>
          </div>

          <div class="toolbar-right">
            <label class="field-inline">
              <span>Status</span>
              <select class="select" id="statusFilter">
                <option value="active">Ativos</option>
                <option value="archived">Arquivados</option>
                <option value="all">Todos</option>
              </select>
            </label>

            <label class="field-inline">
              <span>Ordenar</span>
              <select class="select" id="sortBy">
                <option value="updatedAt">Atualização</option>
                <option value="createdAt">Criação</option>
                <option value="name">Nome</option>
              </select>
            </label>

            <label class="field-inline">
              <span>Ordem</span>
              <select class="select" id="order">
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </label>
          </div>
        </div>

        <div class="table-wrap">
          <table class="table" id="crmTable">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>Tags</th>
                <th>Atualizado</th>
                <th class="col-actions">Ações</th>
              </tr>
            </thead>
            <tbody id="crmTbody">
              <tr><td colspan="6" class="muted">Carregando...</td></tr>
            </tbody>
          </table>
        </div>

        <div class="pager">
          <div class="pager-info" id="pagerInfo"></div>
          <div class="pager-actions">
            <button class="btn" id="btnPrev">Anterior</button>
            <button class="btn" id="btnNext">Próximo</button>
          </div>
        </div>
      </section>

      <!-- Modal + Backdrop -->
      <div class="modal-backdrop" id="crmModalBackdrop"></div>

      <div class="modal" id="crmModal" role="dialog" aria-modal="true" aria-labelledby="crmModalTitle">
        <div class="modal-card">
          <div class="modal-header">
            <h2 id="crmModalTitle">Novo cliente</h2>
            <button class="btn ghost" id="btnCloseModal" aria-label="Fechar">✕</button>
          </div>

          <div class="modal-body">
            <div class="alert error" id="crmModalErrors" style="display:none;"></div>

            <div class="form-grid">
              <label class="field">
                <span>Nome *</span>
                <input class="input" id="f_name" placeholder="Ex: João Silva" />
              </label>

              <label class="field">
                <span>Telefone</span>
                <input class="input" id="f_phone" placeholder="(15) 99999-0000" />
              </label>

              <label class="field">
                <span>E-mail</span>
                <input class="input" id="f_email" placeholder="joao@email.com" />
              </label>

              <label class="field">
                <span>CPF/CNPJ</span>
                <input class="input" id="f_cpf" placeholder="Somente números ou formatado" />
              </label>

              <label class="field">
                <span>Cidade</span>
                <input class="input" id="f_city" placeholder="Boituva" />
              </label>

              <label class="field">
                <span>Bairro</span>
                <input class="input" id="f_neighborhood" placeholder="Centro" />
              </label>

              <label class="field field-full">
                <span>Endereço</span>
                <input class="input" id="f_address" placeholder="Rua, número, complemento" />
              </label>

              <label class="field field-full">
                <span>Tags (separadas por vírgula)</span>
                <input class="input" id="f_tags" placeholder="iphone, vip, delivery" />
              </label>

              <label class="field field-full">
                <span>Observações</span>
                <textarea class="textarea" id="f_notes" rows="4" placeholder="Notas internas..."></textarea>
              </label>

              <label class="field">
                <span>Status</span>
                <select class="select" id="f_status">
                  <option value="active">Ativo</option>
                  <option value="archived">Arquivado</option>
                </select>
              </label>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn ghost" id="btnCancelModal">Cancelar</button>
            <button class="btn primary" id="btnSaveClient">Salvar</button>
          </div>
        </div>
      </div>
    `;

    // Ajusta filtros com estado atual
    qs("#searchInput").value = state.q;
    qs("#statusFilter").value = state.status;
    qs("#sortBy").value = state.sortBy;
    qs("#order").value = state.order;

    bindEvents();
    await refresh();
  }

  function bindEvents() {
    // Evita duplicação (re-render troca DOM)
    qs("#btnNewClient").addEventListener("click", onNew);
    qs("#btnSearch").addEventListener("click", onSearch);
    qs("#btnClearSearch").addEventListener("click", onClearSearch);

    qs("#searchInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") onSearch();
    });

    qs("#statusFilter").addEventListener("change", async (e) => {
      state.status = e.target.value;
      state.page = 1;
      await refresh();
    });

    qs("#sortBy").addEventListener("change", async (e) => {
      state.sortBy = e.target.value;
      state.page = 1;
      await refresh();
    });

    qs("#order").addEventListener("change", async (e) => {
      state.order = e.target.value;
      state.page = 1;
      await refresh();
    });

    qs("#btnPrev").addEventListener("click", async () => {
      if (!state.lastList) return;
      if (state.page <= 1) return;
      state.page -= 1;
      await refresh();
    });

    qs("#btnNext").addEventListener("click", async () => {
      if (!state.lastList) return;
      if (state.page >= state.lastList.totalPages) return;
      state.page += 1;
      await refresh();
    });

    // Modal
    qs("#btnCloseModal").addEventListener("click", closeModal);
    qs("#btnCancelModal").addEventListener("click", closeModal);
    qs("#crmModalBackdrop").addEventListener("click", closeModal);

    qs("#btnSaveClient").addEventListener("click", onSave);
  }

  async function refresh() {
    await CRMRepo.init();

    const result = await CRMRepo.list({
      q: state.q,
      status: state.status,
      sortBy: state.sortBy,
      order: state.order,
      page: state.page,
      pageSize: state.pageSize,
    });

    state.lastList = result;
    renderTable(result.items);
    renderPager(result);
  }

  function renderTable(items) {
    const tbody = qs("#crmTbody");
    if (!items || items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="muted">Nenhum cliente encontrado.</td></tr>`;
      return;
    }

    tbody.innerHTML = items
      .map((c) => {
        const tags = (c.tags || []).slice(0, 4).map(t => `<span class="tag">${esc(t)}</span>`).join(" ");
        const more = (c.tags || []).length > 4 ? `<span class="tag muted">+${(c.tags || []).length - 4}</span>` : "";

        const actions = c.status === "archived"
          ? `
            <button class="btn small" data-act="restore" data-id="${esc(c.id)}">Restaurar</button>
            <button class="btn small danger" data-act="remove" data-id="${esc(c.id)}">Remover</button>
          `
          : `
            <button class="btn small" data-act="edit" data-id="${esc(c.id)}">Editar</button>
            <button class="btn small" data-act="archive" data-id="${esc(c.id)}">Arquivar</button>
            <button class="btn small danger" data-act="remove" data-id="${esc(c.id)}">Remover</button>
          `;

        return `
          <tr>
            <td>
              <div class="cell-title">${esc(c.name)}</div>
              <div class="cell-sub muted">Criado: ${esc(formatDate(c.createdAt))}</div>
            </td>
            <td>${esc(formatPhoneDigits(c.phone))}</td>
            <td>${esc(c.email || "")}</td>
            <td>${tags} ${more}</td>
            <td>${esc(formatDate(c.updatedAt))}</td>
            <td class="col-actions">${actions}</td>
          </tr>
        `;
      })
      .join("");

    // Bind actions
    qsa('[data-act="edit"]').forEach(btn => btn.addEventListener("click", () => onEdit(btn.dataset.id)));
    qsa('[data-act="archive"]').forEach(btn => btn.addEventListener("click", () => onArchive(btn.dataset.id)));
    qsa('[data-act="restore"]').forEach(btn => btn.addEventListener("click", () => onRestore(btn.dataset.id)));
    qsa('[data-act="remove"]').forEach(btn => btn.addEventListener("click", () => onRemove(btn.dataset.id)));
  }

  function renderPager(result) {
    const info = qs("#pagerInfo");
    const total = result.total || 0;
    const page = result.page || 1;
    const totalPages = result.totalPages || 1;

    info.textContent = `Total: ${total} | Página ${page} de ${totalPages}`;

    qs("#btnPrev").disabled = page <= 1;
    qs("#btnNext").disabled = page >= totalPages;
  }

  function onSearch() {
    state.q = qs("#searchInput").value.trim();
    state.page = 1;
    refresh();
  }

  function onClearSearch() {
    qs("#searchInput").value = "";
    state.q = "";
    state.page = 1;
    refresh();
  }

  function onNew() {
    state.editingId = null;
    setModalTitle("Novo cliente");
    clearForm();
    clearModalErrors();
    openModal();
    // Foco prático
    setTimeout(() => qs("#f_name")?.focus(), 0);
  }

  async function onEdit(id) {
    const client = await CRMRepo.getById(id);
    if (!client) return;

    state.editingId = id;
    setModalTitle("Editar cliente");
    clearModalErrors();
    fillForm(client);
    openModal();
    setTimeout(() => qs("#f_name")?.focus(), 0);
  }

  async function onArchive(id) {
    const ok = confirm("Arquivar este cliente? (Você pode restaurar depois)");
    if (!ok) return;
    const r = await CRMRepo.archive(id);
    if (!r.ok) alert((r.errors || ["Falha ao arquivar."]).join("\n"));
    await refresh();
  }

  async function onRestore(id) {
    const ok = confirm("Restaurar este cliente?");
    if (!ok) return;
    const r = await CRMRepo.restore(id);
    if (!r.ok) alert((r.errors || ["Falha ao restaurar."]).join("\n"));
    await refresh();
  }

  async function onRemove(id) {
    const ok = confirm("Remover definitivamente? Essa ação não pode ser desfeita.");
    if (!ok) return;
    const r = await CRMRepo.remove(id);
    if (!r.ok) alert((r.errors || ["Falha ao remover."]).join("\n"));
    await refresh();
  }

  async function onSave() {
    clearModalErrors();
    const payload = getFormPayload();

    // Regra prática: nome obrigatório (reforça UX)
    if (!payload.name.trim()) {
      showModalErrors(["Nome é obrigatório."]);
      return;
    }

    let r;
    if (state.editingId) {
      r = await CRMRepo.update(state.editingId, payload);
    } else {
      r = await CRMRepo.create(payload);
    }

    if (!r.ok) {
      showModalErrors(r.errors || ["Falha ao salvar."]);
      return;
    }

    closeModal();
    await refresh();
  }

  return {
    /**
     * Monta a página CRM dentro de um container.
     * @param {{rootEl: HTMLElement}} params
     */
    async mount({ rootEl }) {
      root = rootEl;
      state.page = 1;
      await render();
    },

    /**
     * Desmonta a página (limpa o container).
     */
    unmount() {
      if (root) root.innerHTML = "";
      root = null;
    },
  };
})();
