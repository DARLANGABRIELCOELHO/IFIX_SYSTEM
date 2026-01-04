// src/data/crm.repo.js
// Repositório de Clientes (CRM)
// Responsabilidade: CRUD + buscas/filtros + persistência via storage.js
// UI não entra aqui.

import { Storage } from "./storage.js";

const STORE_KEY = "ifix_crm_clients_v1";

/**
 * Modelo base de Cliente
 * @typedef {Object} Client
 * @property {string} id
 * @property {string} name
 * @property {string|null} phone
 * @property {string|null} email
 * @property {string|null} cpf
 * @property {string|null} document   // RG/CNPJ/outros (livre)
 * @property {string|null} city
 * @property {string|null} neighborhood
 * @property {string|null} address
 * @property {string|null} notes
 * @property {string[]} tags
 * @property {"active"|"archived"} status
 * @property {number} createdAt
 * @property {number} updatedAt
 */

function now() {
  return Date.now();
}

// ID simples e estável (bom o suficiente para MVP offline)
function uid(prefix = "cli") {
  return `${prefix}_${now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function toStr(v) {
  return (v ?? "").toString().trim();
}

function normalizePhone(phone) {
  const digits = toStr(phone).replace(/\D/g, "");
  if (!digits) return null;
  // Mantém só números; UI decide como formatar
  return digits;
}

function normalizeEmail(email) {
  const e = toStr(email).toLowerCase();
  return e ? e : null;
}

function normalizeCPF(cpf) {
  const digits = toStr(cpf).replace(/\D/g, "");
  return digits ? digits : null;
}

function normalizeTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) {
    return tags.map(t => toStr(t)).filter(Boolean);
  }
  // aceita "tag1, tag2"
  return toStr(tags)
    .split(",")
    .map(t => t.trim())
    .filter(Boolean);
}

function validateClientPayload(payload, { partial = false } = {}) {
  // partial=true permite update sem todos os campos obrigatórios
  const errors = [];

  const name = toStr(payload?.name);
  if (!partial && !name) errors.push("Nome é obrigatório.");
  if (name && name.length < 2) errors.push("Nome muito curto (mín. 2 caracteres).");

  const phone = normalizePhone(payload?.phone);
  if (phone && phone.length < 10) errors.push("Telefone inválido (mín. 10 dígitos).");

  const email = normalizeEmail(payload?.email);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("E-mail inválido.");
  }

  const cpf = normalizeCPF(payload?.cpf);
  if (cpf && !(cpf.length === 11 || cpf.length === 14)) {
    // 11 CPF, 14 CNPJ (se você quiser usar o mesmo campo)
    errors.push("Documento (CPF/CNPJ) inválido.");
  }

  return errors;
}

function applyDefaults(payload) {
  /** @type {Client} */
  const base = {
    id: uid(),
    name: toStr(payload?.name),
    phone: normalizePhone(payload?.phone),
    email: normalizeEmail(payload?.email),
    cpf: normalizeCPF(payload?.cpf),
    document: toStr(payload?.document) || null,
    city: toStr(payload?.city) || null,
    neighborhood: toStr(payload?.neighborhood) || null,
    address: toStr(payload?.address) || null,
    notes: toStr(payload?.notes) || null,
    tags: normalizeTags(payload?.tags),
    status: payload?.status === "archived" ? "archived" : "active",
    createdAt: now(),
    updatedAt: now(),
  };

  return base;
}

function mergeForUpdate(existing, patch) {
  const merged = {
    ...existing,
    ...patch,
    // normalizações importantes
    name: patch?.name !== undefined ? toStr(patch.name) : existing.name,
    phone: patch?.phone !== undefined ? normalizePhone(patch.phone) : existing.phone,
    email: patch?.email !== undefined ? normalizeEmail(patch.email) : existing.email,
    cpf: patch?.cpf !== undefined ? normalizeCPF(patch.cpf) : existing.cpf,
    document: patch?.document !== undefined ? (toStr(patch.document) || null) : existing.document,
    city: patch?.city !== undefined ? (toStr(patch.city) || null) : existing.city,
    neighborhood:
      patch?.neighborhood !== undefined ? (toStr(patch.neighborhood) || null) : existing.neighborhood,
    address: patch?.address !== undefined ? (toStr(patch.address) || null) : existing.address,
    notes: patch?.notes !== undefined ? (toStr(patch.notes) || null) : existing.notes,
    tags: patch?.tags !== undefined ? normalizeTags(patch.tags) : existing.tags,
    status: patch?.status === "archived" ? "archived" : patch?.status === "active" ? "active" : existing.status,
    updatedAt: now(),
  };

  return merged;
}

async function loadAll() {
  const data = await Storage.get(STORE_KEY);
  if (!data) return [];
  if (!Array.isArray(data)) return [];
  return data;
}

async function saveAll(list) {
  await Storage.set(STORE_KEY, list);
}

function includesText(haystack, needle) {
  if (!needle) return true;
  return haystack.includes(needle);
}

function buildSearchIndex(client) {
  // índice simples para busca rápida
  const parts = [
    client.name,
    client.phone ?? "",
    client.email ?? "",
    client.cpf ?? "",
    client.document ?? "",
    client.city ?? "",
    client.neighborhood ?? "",
    client.address ?? "",
    client.notes ?? "",
    ...(client.tags ?? []),
  ];
  return parts.join(" ").toLowerCase();
}

function sortClients(list, sortBy, order) {
  const dir = order === "asc" ? 1 : -1;

  const keyFn = (c) => {
    switch (sortBy) {
      case "name":
        return (c.name || "").toLowerCase();
      case "updatedAt":
        return c.updatedAt || 0;
      case "createdAt":
      default:
        return c.createdAt || 0;
    }
  };

  return [...list].sort((a, b) => {
    const ka = keyFn(a);
    const kb = keyFn(b);
    if (ka < kb) return -1 * dir;
    if (ka > kb) return 1 * dir;
    return 0;
  });
}

function paginate(list, page, pageSize) {
  const p = Math.max(1, Number(page || 1));
  const ps = Math.max(1, Number(pageSize || 20));
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / ps));
  const start = (p - 1) * ps;
  const end = start + ps;

  return {
    page: p,
    pageSize: ps,
    total,
    totalPages,
    items: list.slice(start, end),
  };
}

/**
 * CRMRepo - API pública do repositório
 */
export const CRMRepo = {
  /**
   * Inicializa o store com array vazio se não existir.
   */
  async init() {
    const current = await Storage.get(STORE_KEY);
    if (!current) await Storage.set(STORE_KEY, []);
    return true;
  },

  /**
   * Lista com filtros.
   * @param {Object} [opts]
   * @param {string} [opts.q] Busca textual (nome, telefone, email, tags, etc.)
   * @param {"active"|"archived"|"all"} [opts.status]
   * @param {string[]} [opts.tags] exige TODAS as tags
   * @param {"createdAt"|"updatedAt"|"name"} [opts.sortBy]
   * @param {"asc"|"desc"} [opts.order]
   * @param {number} [opts.page]
   * @param {number} [opts.pageSize]
   */
  async list(opts = {}) {
    const {
      q = "",
      status = "active",
      tags = [],
      sortBy = "updatedAt",
      order = "desc",
      page = 1,
      pageSize = 20,
    } = opts;

    const needle = toStr(q).toLowerCase();
    const wantedTags = Array.isArray(tags) ? tags.map(t => toStr(t)).filter(Boolean) : [];

    const all = await loadAll();

    let filtered = all;

    if (status !== "all") {
      filtered = filtered.filter(c => (c.status || "active") === status);
    }

    if (wantedTags.length) {
      filtered = filtered.filter(c => {
        const set = new Set((c.tags || []).map(t => toStr(t)));
        return wantedTags.every(t => set.has(t));
      });
    }

    if (needle) {
      filtered = filtered.filter(c => includesText(buildSearchIndex(c), needle));
    }

    const sorted = sortClients(filtered, sortBy, order);
    return paginate(sorted, page, pageSize);
  },

  /**
   * Retorna um cliente por ID.
   */
  async getById(id) {
    const key = toStr(id);
    if (!key) return null;
    const all = await loadAll();
    return all.find(c => c.id === key) || null;
  },

  /**
   * Cria um cliente.
   * @returns {{ok:true, client:Client} | {ok:false, errors:string[]}}
   */
  async create(payload) {
    const errors = validateClientPayload(payload, { partial: false });
    if (errors.length) return { ok: false, errors };

    const all = await loadAll();

    // Regras simples anti-duplicidade (opcional, mas recomendado)
    const phone = normalizePhone(payload?.phone);
    const email = normalizeEmail(payload?.email);
    const cpf = normalizeCPF(payload?.cpf);

    if (phone && all.some(c => c.phone === phone && c.status !== "archived")) {
      return { ok: false, errors: ["Já existe um cliente ativo com este telefone."] };
    }
    if (email && all.some(c => c.email === email && c.status !== "archived")) {
      return { ok: false, errors: ["Já existe um cliente ativo com este e-mail."] };
    }
    if (cpf && all.some(c => c.cpf === cpf && c.status !== "archived")) {
      return { ok: false, errors: ["Já existe um cliente ativo com este documento."] };
    }

    const client = applyDefaults(payload);
    all.push(client);
    await saveAll(all);

    return { ok: true, client };
  },

  /**
   * Atualiza um cliente por ID.
   * @returns {{ok:true, client:Client} | {ok:false, errors:string[]}}
   */
  async update(id, patch) {
    const key = toStr(id);
    if (!key) return { ok: false, errors: ["ID inválido."] };

    const errors = validateClientPayload(patch, { partial: true });
    if (errors.length) return { ok: false, errors };

    const all = await loadAll();
    const idx = all.findIndex(c => c.id === key);
    if (idx === -1) return { ok: false, errors: ["Cliente não encontrado."] };

    const current = all[idx];
    const updated = mergeForUpdate(current, patch);

    // Regras simples anti-duplicidade (quando mudar)
    const phone = updated.phone;
    const email = updated.email;
    const cpf = updated.cpf;

    if (phone && all.some(c => c.id !== key && c.phone === phone && c.status !== "archived")) {
      return { ok: false, errors: ["Já existe um cliente ativo com este telefone."] };
    }
    if (email && all.some(c => c.id !== key && c.email === email && c.status !== "archived")) {
      return { ok: false, errors: ["Já existe um cliente ativo com este e-mail."] };
    }
    if (cpf && all.some(c => c.id !== key && c.cpf === cpf && c.status !== "archived")) {
      return { ok: false, errors: ["Já existe um cliente ativo com este documento."] };
    }

    all[idx] = updated;
    await saveAll(all);

    return { ok: true, client: updated };
  },

  /**
   * Arquiva (soft delete). Mantém histórico.
   */
  async archive(id) {
    return this.update(id, { status: "archived" });
  },

  /**
   * Restaura cliente arquivado.
   */
  async restore(id) {
    return this.update(id, { status: "active" });
  },

  /**
   * Remove definitivamente (hard delete).
   * Use com cautela.
   */
  async remove(id) {
    const key = toStr(id);
    if (!key) return { ok: false, errors: ["ID inválido."] };

    const all = await loadAll();
    const next = all.filter(c => c.id !== key);
    if (next.length === all.length) {
      return { ok: false, errors: ["Cliente não encontrado."] };
    }

    await saveAll(next);
    return { ok: true };
  },

  /**
   * Utilitário: limpa tudo (somente dev/teste).
   */
  async clearAll() {
    await saveAll([]);
    return { ok: true };
  },
};
