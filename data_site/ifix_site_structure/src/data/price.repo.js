// price.repo.js — repositório de preços/serviços
// Responsabilidade: manter catálogo + buscas e filtros (persistência via Storage)

window.PriceRepo = (function () {
  const KEY = "prices";

  function _norm(str) {
    return String(str ?? "").trim().toLowerCase();
  }

  function getCatalog() {
    return Storage.getJSON(KEY, { updatedAt: null, currency: "BRL", items: [] });
  }

  function setCatalog(catalog) {
    const next = {
      updatedAt: new Date().toISOString(),
      currency: catalog?.currency ?? "BRL",
      items: Array.isArray(catalog?.items) ? catalog.items : [],
    };
    Storage.setJSON(KEY, next);
    return next;
  }

  function list() {
    return getCatalog().items ?? [];
  }

  function upsert(item) {
    const cat = getCatalog();
    const items = cat.items ?? [];

    const id = item?.id ?? Storage.genId("price");
    const idx = items.findIndex((x) => x && x.id === id);

    const nextItem = {
      id,
      brand: item?.brand ?? "",
      model: item?.model ?? "",
      service: item?.service ?? "",
      payment: item?.payment ?? "",
      price: Number(item?.price ?? 0),
      active: item?.active ?? true,
      updatedAt: new Date().toISOString(),
    };

    if (idx >= 0) items[idx] = { ...items[idx], ...nextItem };
    else items.push(nextItem);

    return setCatalog({ ...cat, items });
  }

  function remove(id) {
    const cat = getCatalog();
    const next = (cat.items ?? []).filter((x) => x && x.id !== id);
    return setCatalog({ ...cat, items: next });
  }

  // Busca principal (para sua página de "Consulta de Preços")
  function search({ brand, model, service, payment, query, onlyActive = true } = {}) {
    const q = _norm(query);

    return list().filter((it) => {
      if (onlyActive && it.active === false) return false;

      if (brand && _norm(it.brand) !== _norm(brand)) return false;
      if (model && _norm(it.model) !== _norm(model)) return false;
      if (service && _norm(it.service) !== _norm(service)) return false;
      if (payment && _norm(it.payment) !== _norm(payment)) return false;

      if (q) {
        const blob = _norm([it.brand, it.model, it.service, it.payment, it.price].join(" "));
        if (!blob.includes(q)) return false;
      }

      return true;
    });
  }

  // Helpers para UI (popular selects)
  function getBrands() {
    return uniq(list().map((x) => x.brand).filter(Boolean));
  }

  function getModels(brand) {
    const items = brand ? search({ brand }) : list();
    return uniq(items.map((x) => x.model).filter(Boolean));
  }

  function getServices({ brand, model } = {}) {
    const items = search({ brand, model });
    return uniq(items.map((x) => x.service).filter(Boolean));
  }

  function getPayments({ brand, model, service } = {}) {
    const items = search({ brand, model, service });
    return uniq(items.map((x) => x.payment).filter(Boolean));
  }

  function uniq(arr) {
    return [...new Set(arr.map((x) => String(x).trim()))].filter(Boolean).sort((a, b) => a.localeCompare(b));
  }

  return {
    getCatalog,
    setCatalog,
    list,
    upsert,
    remove,
    search,
    getBrands,
    getModels,
    getServices,
    getPayments,
  };
})();
