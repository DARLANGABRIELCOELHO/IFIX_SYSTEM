// os.repo.js — repositório de Ordens de Serviço
// Responsabilidade: CRUD + filtros e busca (persistência via Storage)

window.OSRepo = (function () {
  const COLLECTION = "os";

  const STATUS = {
    OPEN: "ABERTA",
    IN_PROGRESS: "EM ANDAMENTO",
    WAITING_PARTS: "AGUARDANDO PEÇA",
    DONE: "FINALIZADA",
    CANCELED: "CANCELADA",
  };

  function _norm(str) {
    return String(str ?? "").trim().toLowerCase();
  }

  function _sumItems(items) {
    if (!Array.isArray(items)) return 0;
    return items.reduce((acc, it) => acc + Number(it?.subtotal ?? it?.price ?? 0), 0);
  }

  function create(payload = {}) {
    // Estrutura padrão (você pode expandir depois)
    const now = new Date().toISOString();

    const entity = {
      // Relacionamento
      customerId: payload.customerId ?? null,
      customerName: payload.customerName ?? "", // útil se você não quiser depender do CRM no MVP

      // Aparelho / Serviço
      deviceBrand: payload.deviceBrand ?? "", // Apple / Samsung / Motorola etc
      deviceModel: payload.deviceModel ?? "",
      imei: payload.imei ?? "",
      problem: payload.problem ?? "",
      observations: payload.observations ?? "",

      // Itens / valores
      items: Array.isArray(payload.items) ? payload.items : [], // [{name, price, qty, subtotal}]
      subtotal: Number(payload.subtotal ?? _sumItems(payload.items)),
      discount: Number(payload.discount ?? 0),
      total: Number(payload.total ?? (Number(payload.subtotal ?? _sumItems(payload.items)) - Number(payload.discount ?? 0))),

      // Pagamento
      paymentMethod: payload.paymentMethod ?? "", // Pix / Dinheiro / Cartão etc
      paid: Boolean(payload.paid ?? false),

      // Status
      status: payload.status ?? STATUS.OPEN,

      // Datas
      openedAt: payload.openedAt ?? now,
      closedAt: payload.closedAt ?? null,

      // Metadados
      tags: Array.isArray(payload.tags) ? payload.tags : [],
    };

    return Storage.insert(COLLECTION, entity);
  }

  function list() {
    return Storage.list(COLLECTION);
  }

  function getById(id) {
    return Storage.getById(COLLECTION, id);
  }

  function update(id, patch = {}) {
    // ajustes automáticos mínimos
    if (patch.status === STATUS.DONE && !patch.closedAt) {
      patch.closedAt = new Date().toISOString();
    }
    return Storage.update(COLLECTION, id, patch);
  }

  function remove(id) {
    return Storage.removeById(COLLECTION, id);
  }

  // ===== filtros =====
  function search(query = "") {
    const q = _norm(query);
    if (!q) return list();

    return list().filter((os) => {
      const blob = _norm([
        os.id,
        os.customerName,
        os.deviceBrand,
        os.deviceModel,
        os.problem,
        os.status,
        os.paymentMethod,
        os.imei,
      ].join(" "));
      return blob.includes(q);
    });
  }

  function filterByStatus(status) {
    const s = _norm(status);
    return list().filter((os) => _norm(os.status) === s);
  }

  function filterByCustomer(customerId) {
    return list().filter((os) => os.customerId === customerId);
  }

  function sortByDate(direction = "desc") {
    const dir = _norm(direction) === "asc" ? 1 : -1;
    return [...list()].sort((a, b) => {
      const da = Date.parse(a.openedAt ?? 0) || 0;
      const db = Date.parse(b.openedAt ?? 0) || 0;
      return (da - db) * dir;
    });
  }

  function stats() {
    const items = list();
    const total = items.length;

    const byStatus = items.reduce((acc, os) => {
      const k = os.status ?? "SEM STATUS";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});

    const revenue = items
      .filter((os) => os.status === STATUS.DONE)
      .reduce((acc, os) => acc + Number(os.total ?? 0), 0);

    return { total, byStatus, revenue };
  }

  return {
    STATUS,
    create,
    list,
    getById,
    update,
    remove,
    search,
    filterByStatus,
    filterByCustomer,
    sortByDate,
    stats,
  };
})();
