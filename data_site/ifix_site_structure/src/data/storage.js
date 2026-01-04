// storage.js — ponto único de persistência (localStorage)
// Responsabilidade: padronizar leitura/escrita, ids, coleções, seed e "migrations" simples.

window.Storage = (function () {
  const NS = "ifix"; // namespace do projeto
  const VERSION_KEY = `${NS}:version`;

  function _key(name) {
    return `${NS}:${name}`;
  }

  function _nowISO() {
    return new Date().toISOString();
  }

  function _readRaw(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v == null ? fallback : v;
    } catch (e) {
      console.error("Storage._readRaw error", e);
      return fallback;
    }
  }

  function _writeRaw(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.error("Storage._writeRaw error", e);
      return false;
    }
  }

  function getJSON(name, fallback) {
    const raw = _readRaw(_key(name), null);
    if (raw == null) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function setJSON(name, value) {
    return _writeRaw(_key(name), JSON.stringify(value));
  }

  function remove(name) {
    try {
      localStorage.removeItem(_key(name));
      return true;
    } catch (e) {
      console.error("Storage.remove error", e);
      return false;
    }
  }

  function clearAll() {
    // Apaga apenas o namespace ifix
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((k) => {
        if (k.startsWith(`${NS}:`)) localStorage.removeItem(k);
      });
      return true;
    } catch (e) {
      console.error("Storage.clearAll error", e);
      return false;
    }
  }

  function genId(prefix = "id") {
    // id curto, suficiente p/ localStorage
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  // ====== API de coleção (CRUD genérico) ======
  function ensureCollection(name, seed = []) {
    const current = getJSON(name, null);
    if (!Array.isArray(current)) setJSON(name, seed);
    return true;
  }

  function list(name) {
    return getJSON(name, []);
  }

  function getById(name, id) {
    const items = list(name);
    return items.find((x) => x && x.id === id) || null;
  }

  function insert(name, entity) {
    const items = list(name);
    const now = _nowISO();

    const e = {
      id: entity?.id ?? genId(name),
      createdAt: entity?.createdAt ?? now,
      updatedAt: entity?.updatedAt ?? now,
      ...entity,
    };

    items.push(e);
    setJSON(name, items);
    return e;
  }

  function update(name, id, patch) {
    const items = list(name);
    const idx = items.findIndex((x) => x && x.id === id);
    if (idx < 0) return null;

    const now = _nowISO();
    const next = {
      ...items[idx],
      ...patch,
      id,
      updatedAt: now,
    };

    items[idx] = next;
    setJSON(name, items);
    return next;
  }

  function removeById(name, id) {
    const items = list(name);
    const next = items.filter((x) => x && x.id !== id);
    setJSON(name, next);
    return next.length !== items.length;
  }

  // ====== Versão / Migração simples ======
  function getVersion() {
    const raw = _readRaw(VERSION_KEY, "0");
    const v = Number(raw);
    return Number.isFinite(v) ? v : 0;
  }

  function setVersion(v) {
    return _writeRaw(VERSION_KEY, String(v));
  }

  function init({ version = 1, seeds = {} } = {}) {
    // seeds: { os: [...], prices: {...} }
    // cria estruturas mínimas se não existir
    if (seeds.os) ensureCollection("os", seeds.os);
    else ensureCollection("os", []);

    // prices pode ser objeto (catálogo) e não lista
    if (seeds.prices) {
      const cur = getJSON("prices", null);
      if (cur == null) setJSON("prices", seeds.prices);
    } else {
      const cur = getJSON("prices", null);
      if (cur == null) setJSON("prices", defaultPricesSeed());
    }

    // versioning
    const currentV = getVersion();
    if (currentV < version) {
      // aqui entram futuras migrações, se precisar
      setVersion(version);
    }

    return true;
  }

  function defaultPricesSeed() {
    // Catálogo mínimo para o sistema funcionar
    return {
      updatedAt: _nowISO(),
      currency: "BRL",
      items: [
        { id: genId("price"), brand: "Apple", model: "iPhone 11", service: "Troca de Bateria", payment: "Pix", price: 249 },
        { id: genId("price"), brand: "Apple", model: "iPhone 11", service: "Troca de Tela", payment: "Pix", price: 699 },
        { id: genId("price"), brand: "Samsung", model: "Galaxy A12", service: "Troca de Tela", payment: "Pix", price: 349 },
      ],
    };
  }

  return {
    // base
    init,
    getJSON,
    setJSON,
    remove,
    clearAll,

    // coleção
    ensureCollection,
    list,
    getById,
    insert,
    update,
    removeById,

    // utils
    genId,
    getVersion,
    setVersion,
  };
})();
