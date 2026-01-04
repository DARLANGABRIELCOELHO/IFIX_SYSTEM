// src/data/storage.js
// Sistema de armazenamento único com versionamento, migrações e coleções

const STORAGE_VERSION = 2;
const NAMESPACE = "ifix";

class StorageError extends Error {
  constructor(message, code = "STORAGE_ERROR") {
    super(message);
    this.name = "StorageError";
    this.code = code;
  }
}

export const Storage = (function () {
  const VERSION_KEY = `${NAMESPACE}:version`;
  const META_KEY = `${NAMESPACE}:meta`;

  // ==================== HELPERS ====================
  function getKey(name) {
    return `${NAMESPACE}:${name}`;
  }

  function safeParse(json, fallback) {
    try {
      return json ? JSON.parse(json) : fallback;
    } catch {
      return fallback;
    }
  }

  function safeStringify(data) {
    try {
      return JSON.stringify(data);
    } catch {
      return "null";
    }
  }

  function createId(prefix = "item") {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 11);
    return `${prefix}_${timestamp}_${random}`;
  }

  function nowISO() {
    return new Date().toISOString();
  }

  // ==================== CORE ====================
  function get(name, fallback = null) {
    const key = getKey(name);
    try {
      const value = localStorage.getItem(key);
      return value !== null ? safeParse(value, fallback) : fallback;
    } catch (error) {
      console.error(`Storage.get error for ${name}:`, error);
      return fallback;
    }
  }

  function set(name, value) {
    const key = getKey(name);
    try {
      localStorage.setItem(key, safeStringify(value));
      return true;
    } catch (error) {
      console.error(`Storage.set error for ${name}:`, error);
      throw new StorageError(`Failed to save ${name}`, "SET_ERROR");
    }
  }

  function remove(name) {
    try {
      localStorage.removeItem(getKey(name));
      return true;
    } catch (error) {
      console.error(`Storage.remove error for ${name}:`, error);
      return false;
    }
  }

  function has(name) {
    return localStorage.getItem(getKey(name)) !== null;
  }

  function clear(includeMeta = false) {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(`${NAMESPACE}:`)) {
          if (includeMeta || (key !== VERSION_KEY && key !== META_KEY)) {
            localStorage.removeItem(key);
          }
        }
      });
      return true;
    } catch (error) {
      console.error("Storage.clear error:", error);
      return false;
    }
  }

  // ==================== COLLECTION API ====================
  function collection(name) {
    const getCollection = () => get(name, []);
    const setCollection = (data) => set(name, data);

    return {
      name,
      
      all() {
        return getCollection();
      },

      find(predicate) {
        return getCollection().find(predicate);
      },

      filter(predicate) {
        return getCollection().filter(predicate);
      },

      findById(id) {
        return getCollection().find(item => item && item.id === id);
      },

      where(conditions) {
        return getCollection().filter(item => {
          return Object.entries(conditions).every(([key, value]) => {
            if (Array.isArray(value)) {
              return value.includes(item[key]);
            }
            return item[key] === value;
          });
        });
      },

      create(data) {
        const items = getCollection();
        const now = nowISO();
        const id = data.id || createId(name.substring(0, 3));
        
        const item = {
          id,
          ...data,
          createdAt: data.createdAt || now,
          updatedAt: data.updatedAt || now,
          version: 1
        };

        items.push(item);
        setCollection(items);
        return item;
      },

      update(id, data, options = {}) {
        const items = getCollection();
        const index = items.findIndex(item => item.id === id);
        
        if (index === -1) {
          if (options.upsert) {
            return this.create({ ...data, id });
          }
          return null;
        }

        const now = nowISO();
        const current = items[index];
        const version = current.version || 1;

        // Merge, preservando campos que não devem ser sobrescritos
        const updated = {
          ...current,
          ...data,
          id, // Garante que ID não muda
          updatedAt: now,
          version: version + 1
        };

        // Preserva createdAt se não estiver sendo explicitamente alterado
        if (!data.createdAt) {
          updated.createdAt = current.createdAt;
        }

        items[index] = updated;
        setCollection(items);
        return updated;
      },

      upsert(data) {
        if (data.id && this.findById(data.id)) {
          return this.update(data.id, data);
        }
        return this.create(data);
      },

      delete(id) {
        const items = getCollection();
        const filtered = items.filter(item => item.id !== id);
        
        if (filtered.length === items.length) {
          return false;
        }

        setCollection(filtered);
        return true;
      },

      deleteWhere(conditions) {
        const items = getCollection();
        const filtered = items.filter(item => {
          return !Object.entries(conditions).every(([key, value]) => {
            return item[key] === value;
          });
        });

        const deleted = items.length - filtered.length;
        if (deleted > 0) {
          setCollection(filtered);
        }
        return deleted;
      },

      count() {
        return getCollection().length;
      },

      paginate(page = 1, pageSize = 20, predicate = null) {
        const items = predicate ? this.filter(predicate) : getCollection();
        const total = items.length;
        const totalPages = Math.ceil(total / pageSize);
        const currentPage = Math.min(Math.max(1, page), totalPages);
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;

        return {
          items: items.slice(start, end),
          page: currentPage,
          pageSize,
          total,
          totalPages,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1
        };
      },

      clear() {
        setCollection([]);
        return true;
      }
    };
  }

  // ==================== VERSION & MIGRATIONS ====================
  function getVersion() {
    return parseInt(get(VERSION_KEY, "0"), 10);
  }

  function setVersion(version) {
    set(VERSION_KEY, version);
    updateMeta({ lastMigration: nowISO(), version });
  }

  function getMeta() {
    return get(META_KEY, {
      createdAt: nowISO(),
      version: 0,
      lastMigration: null,
      collections: {}
    });
  }

  function updateMeta(updates) {
    const meta = getMeta();
    set(META_KEY, { ...meta, ...updates, updatedAt: nowISO() });
  }

  function init(options = {}) {
    const { version = STORAGE_VERSION, seeds = {}, reset = false } = options;
    const currentVersion = getVersion();

    if (reset) {
      clear(false); // Mantém meta e version
    }

    // Criar coleções se não existirem
    const collections = ["clients", "orders", "prices", "settings"];
    collections.forEach(name => {
      if (!has(name)) {
        set(name, seeds[name] || []);
      }
    });

    // Executar migrações se necessário
    if (currentVersion < version) {
      migrate(currentVersion, version);
    }

    updateMeta({
      initializedAt: nowISO(),
      version,
      collections: collections.reduce((acc, name) => {
        acc[name] = get(name, []).length;
        return acc;
      }, {})
    });

    return {
      version,
      meta: getMeta(),
      collections: collections.map(name => ({
        name,
        count: get(name, []).length
      }))
    };
  }

  function migrate(fromVersion, toVersion) {
    const migrations = {
      1: () => {
        // Migração da v0 para v1: reestruturação de dados antigos
        const oldClients = get("crm", []);
        if (oldClients.length > 0) {
          set("clients", oldClients);
          remove("crm");
        }
      },
      2: () => {
        // Migração da v1 para v2: adicionar campos novos
        const clients = get("clients", []);
        const updatedClients = clients.map(client => ({
          ...client,
          version: client.version || 1,
          deletedAt: null,
          syncedAt: null
        }));
        set("clients", updatedClients);
      }
    };

    for (let v = fromVersion + 1; v <= toVersion; v++) {
      if (migrations[v]) {
        try {
          console.log(`Executando migração v${v}...`);
          migrations[v]();
        } catch (error) {
          console.error(`Erro na migração v${v}:`, error);
          throw new StorageError(`Migration v${v} failed`, "MIGRATION_ERROR");
        }
      }
    }

    setVersion(toVersion);
  }

  // ==================== EXPORTS ====================
  return {
    // Core
    get,
    set,
    has,
    remove,
    clear,
    
    // Collections
    collection,
    
    // Meta
    getVersion,
    getMeta,
    
    // Init
    init,
    
    // Utils
    createId,
    nowISO,
    
    // Constants
    VERSION: STORAGE_VERSION,
    NAMESPACE
  };
})();

// Export default para compatibilidade
export default Storage;