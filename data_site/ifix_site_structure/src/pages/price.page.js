// price.page.js — Página de Consulta de Preços (UI + leitura/escrita)
// Responsabilidade: filtros (marca/modelo/serviço/pagamento), busca e tabela
// Inclui um modal simples para "Adicionar/Editar" itens do catálogo

window.Pages = window.Pages || {};

window.Pages["price"] = (function () {
  function render() {
    const root = document.createElement("div");
    root.className = "p-price";

    const header = document.createElement("div");
    header.className = "p-pageHeader";
    header.innerHTML = `
      <div class="p-pageHeader__title">Consulta de Preços</div>
      <div class="p-pageHeader__subtitle">Catálogo interno de serviços e valores</div>
    `;

    const layout = document.createElement("div");
    layout.className = "p-price__layout";

    // ===== Filtros =====
    const filtersCard = Card.render({
      title: "Filtros",
      subtitle: "refine a busca antes de mostrar resultados",
      content: buildFiltersBlock(),
      actions: buildAddButton(root),
    });

    // ===== Resultados =====
    const resultsCard = Card.render({
      title: "Resultados",
      subtitle: "itens encontrados no catálogo",
      content: buildResultsTable({}),
    });

    layout.appendChild(filtersCard);
    layout.appendChild(resultsCard);

    root.appendChild(header);
    root.appendChild(layout);

    wireFilterInteractions(root);
    injectPageStylesOnce();

    return root;
  }

  function buildFiltersBlock() {
    const wrap = document.createElement("div");
    wrap.className = "p-price__filters";

    // selects populados via repo
    wrap.innerHTML = `
      <div class="p-price__row">
        <div class="p-price__field">
          <div class="p-price__label">Marca</div>
          <select class="c-form__input" data-f-brand></select>
        </div>

        <div class="p-price__field">
          <div class="p-price__label">Modelo</div>
          <select class="c-form__input" data-f-model></select>
        </div>

        <div class="p-price__field">
          <div class="p-price__label">Serviço</div>
          <select class="c-form__input" data-f-service></select>
        </div>

        <div class="p-price__field">
          <div class="p-price__label">Pagamento</div>
          <select class="c-form__input" data-f-payment></select>
        </div>
      </div>

      <div class="p-price__row">
        <div class="p-price__field p-price__field--grow">
          <div class="p-price__label">Busca livre</div>
          <input class="c-form__input" placeholder="ex: iPhone 11 bateria pix" data-f-query />
        </div>

        <button class="c-btn c-btn--primary" type="button" data-f-search>Buscar</button>
        <button class="c-btn" type="button" data-f-reset>Limpar</button>
      </div>
    `;

    // popular selects
    populateAllSelects(wrap, {});
    return wrap;
  }

  function buildResultsTable(filters) {
    const rows = PriceRepo.search({
      brand: filters.brand || undefined,
      model: filters.model || undefined,
      service: filters.service || undefined,
      payment: filters.payment || undefined,
      query: filters.query || undefined,
      onlyActive: true,
    });

    const table = Table.render({
      columns: [
        { key: "brand", label: "Marca" },
        { key: "model", label: "Modelo" },
        { key: "service", label: "Serviço" },
        { key: "payment", label: "Pagamento" },
        {
          key: "price",
          label: "Preço",
          render: (row) => formatBRL(row.price ?? 0),
        },
        {
          key: "actions",
          label: "Ações",
          render: (row) => buildRowActions(row),
        },
      ],
      rows,
      emptyText: "Nenhum preço encontrado com esses filtros.",
    });

    const wrap = document.createElement("div");
    wrap.setAttribute("data-price-results", "1");
    wrap.appendChild(table);

    return wrap;
  }

  function buildRowActions(row) {
    const box = document.createElement("div");
    box.style.display = "flex";
    box.style.gap = "8px";
    box.style.flexWrap = "wrap";

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "c-btn";
    edit.textContent = "Editar";
    edit.addEventListener("click", () => openPriceModal({ mode: "edit", item: row }));

    const del = document.createElement("button");
    del.type = "button";
    del.className = "c-btn c-btn--danger";
    del.textContent = "Remover";
    del.addEventListener("click", () => {
      PriceRepo.remove(row.id);
      refreshResultsFromUI();
      refreshFiltersFromUI();
    });

    box.appendChild(edit);
    box.appendChild(del);
    return box;
  }

  function wireFilterInteractions(root) {
    const brandSel = root.querySelector("[data-f-brand]");
    const modelSel = root.querySelector("[data-f-model]");
    const serviceSel = root.querySelector("[data-f-service]");
    const paymentSel = root.querySelector("[data-f-payment]");
    const queryInp = root.querySelector("[data-f-query]");

    const btnSearch = root.querySelector("[data-f-search]");
    const btnReset = root.querySelector("[data-f-reset]");

    // cascata: brand -> models/services/payments
    brandSel.addEventListener("change", () => {
      const brand = brandSel.value || "";
      populateModels(serviceSel, paymentSel, modelSel, brand, "");
      populateServicesAndPayments(serviceSel, paymentSel, brand, modelSel.value || "");
    });

    modelSel.addEventListener("change", () => {
      const brand = brandSel.value || "";
      populateServicesAndPayments(serviceSel, paymentSel, brand, modelSel.value || "");
    });

    serviceSel.addEventListener("change", () => {
      const brand = brandSel.value || "";
      const model = modelSel.value || "";
      populatePayments(paymentSel, brand, model, serviceSel.value || "");
    });

    btnSearch.addEventListener("click", () => {
      const filters = collectFilters(root);
      renderResultsInto(root, filters);
    });

    btnReset.addEventListener("click", () => {
      brandSel.value = "";
      queryInp.value = "";

      populateAllSelects(root, {}); // reseta selects em cascata
      renderResultsInto(root, {});
    });
  }

  function renderResultsInto(root, filters) {
    const cardBody = root.querySelector("[data-price-results]");
    if (!cardBody) return;

    const parent = cardBody.parentElement;
    if (!parent) return;

    parent.replaceChild(buildResultsTable(filters), cardBody);
  }

  function collectFilters(root) {
    return {
      brand: root.querySelector("[data-f-brand]")?.value || "",
      model: root.querySelector("[data-f-model]")?.value || "",
      service: root.querySelector("[data-f-service]")?.value || "",
      payment: root.querySelector("[data-f-payment]")?.value || "",
      query: root.querySelector("[data-f-query]")?.value || "",
    };
  }

  function refreshResultsFromUI() {
    const root = document.querySelector(".p-price");
    if (!root) return;
    renderResultsInto(root, collectFilters(root));
  }

  function refreshFiltersFromUI() {
    const root = document.querySelector(".p-price");
    if (!root) return;
    populateAllSelects(root, collectFilters(root));
  }

  // ===== modal add/edit =====
  function buildAddButton(rootRef) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "c-btn c-btn--primary";
    btn.textContent = "Adicionar";
    btn.addEventListener("click", () => openPriceModal({ mode: "create" }));
    return btn;
  }

  function openPriceModal({ mode = "create", item = null } = {}) {
    const title = mode === "edit" ? "Editar preço" : "Adicionar preço";

    const form = Form.render({
      fields: [
        { name: "brand", label: "Marca", required: true, placeholder: "Apple / Samsung / ..." },
        { name: "model", label: "Modelo", required: true, placeholder: "iPhone 11 / A12 / ..." },
        { name: "service", label: "Serviço", required: true, placeholder: "Troca de Tela / Bateria / ..." },
        { name: "payment", label: "Pagamento", required: true, placeholder: "Pix / Dinheiro / Cartão" },
        {
          name: "price",
          label: "Preço (R$)",
          required: true,
          type: "number",
          validate: (v) => (Number(v) > 0 ? "" : "Informe um preço válido."),
        },
      ],
      values: item || {},
      submitLabel: "Salvar",
      onSubmit: (payload) => {
        const normalized = {
          id: item?.id,
          brand: payload.brand,
          model: payload.model,
          service: payload.service,
          payment: payload.payment,
          price: Number(payload.price),
          active: true,
        };

        PriceRepo.upsert(normalized);

        Modal.close(modal);
        refreshResultsFromUI();
        refreshFiltersFromUI();
      },
    });

    const footer = document.createElement("div");
    footer.style.display = "flex";
    footer.style.gap = "8px";

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "c-btn";
    cancel.textContent = "Cancelar";
    cancel.addEventListener("click", () => Modal.close(modal));

    footer.appendChild(cancel);

    const modal = Modal.create({
      title,
      content: form,
      footer,
      closeOnBackdrop: true,
    });

    Modal.open(modal);
  }

  // ===== helpers de selects =====
  function populateAllSelects(rootOrWrap, filters) {
    const wrap = rootOrWrap;

    const brandSel = wrap.querySelector("[data-f-brand]");
    const modelSel = wrap.querySelector("[data-f-model]");
    const serviceSel = wrap.querySelector("[data-f-service]");
    const paymentSel = wrap.querySelector("[data-f-payment]");

    populateSelect(brandSel, PriceRepo.getBrands(), "Todas");
    brandSel.value = filters.brand || "";

    populateModels(serviceSel, paymentSel, modelSel, brandSel.value || "", filters.model || "");
    populateServicesAndPayments(serviceSel, paymentSel, brandSel.value || "", modelSel.value || "", filters.service || "", filters.payment || "");
  }

  function populateModels(serviceSel, paymentSel, modelSel, brand, selectedModel) {
    const models = brand ? PriceRepo.getModels(brand) : [];
    populateSelect(modelSel, models, "Todos");
    modelSel.value = selectedModel || "";

    // reset downstream
    populateSelect(serviceSel, [], "Todos");
    populateSelect(paymentSel, [], "Todos");
  }

  function populateServicesAndPayments(serviceSel, paymentSel, brand, model, selectedService, selectedPayment) {
    const services = (brand && model) ? PriceRepo.getServices({ brand, model }) : [];
    populateSelect(serviceSel, services, "Todos");
    serviceSel.value = selectedService || "";

    populatePayments(paymentSel, brand, model, serviceSel.value || "", selectedPayment || "");
  }

  function populatePayments(paymentSel, brand, model, service, selectedPayment) {
    const payments = (brand && model && service) ? PriceRepo.getPayments({ brand, model, service }) : [];
    populateSelect(paymentSel, payments, "Todos");
    paymentSel.value = selectedPayment || "";
  }

  function populateSelect(sel, items, placeholderLabel) {
    if (!sel) return;
    sel.innerHTML = "";

    const p = document.createElement("option");
    p.value = "";
    p.textContent = placeholderLabel || "Selecione";
    sel.appendChild(p);

    (items || []).forEach((v) => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = v;
      sel.appendChild(o);
    });
  }

  function formatBRL(value) {
    const v = Number(value ?? 0);
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function injectPageStylesOnce() {
    if (document.getElementById("p-price-styles")) return;
    const style = document.createElement("style");
    style.id = "p-price-styles";
    style.textContent = `
      .p-pageHeader { display:flex; flex-direction:column; gap:4px; margin-bottom:12px; }
      .p-pageHeader__title { font-size:20px; font-weight:700; }
      .p-pageHeader__subtitle { opacity:.7; font-size:12px; }

      .p-price__layout { display:grid; grid-template-columns: 1fr; gap:12px; }

      .p-price__filters { display:flex; flex-direction:column; gap:12px; }
      .p-price__row { display:flex; gap:12px; flex-wrap:wrap; align-items:flex-end; }
      .p-price__field { min-width: 180px; display:flex; flex-direction:column; gap:6px; }
      .p-price__field--grow { flex: 1; min-width: 240px; }
      .p-price__label { font-size:12px; opacity:.8; }

      @media (max-width: 720px) {
        .p-price__field { min-width: 100%; }
      }
    `;
    document.head.appendChild(style);
  }

  return { render };
})();
