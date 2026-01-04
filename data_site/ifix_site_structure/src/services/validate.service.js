// validate.service.js — validações reutilizáveis
// Responsabilidade: validar dados de form e entidades (sem regra de negócio específica)

window.ValidateService = (function () {
  function isRequired(value) {
    return String(value ?? "").trim().length > 0;
  }

  function minLen(value, n) {
    return String(value ?? "").trim().length >= Number(n ?? 0);
  }

  function maxLen(value, n) {
    return String(value ?? "").trim().length <= Number(n ?? 0);
  }

  function isNumber(value) {
    const v = Number(value);
    return Number.isFinite(v);
  }

  function isPositiveNumber(value) {
    const v = Number(value);
    return Number.isFinite(v) && v > 0;
  }

  function inList(value, list = []) {
    return list.includes(value);
  }

  function isPhoneBR(value) {
    const d = String(value ?? "").replace(/\D+/g, "");
    return d.length === 10 || d.length === 11;
  }

  function isEmail(value) {
    const s = String(value ?? "").trim();
    if (!s) return false;
    // simples e suficiente para MVP
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  }

  // CPF (validação padrão)
  function isCPF(value) {
    const cpf = String(value ?? "").replace(/\D+/g, "");
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i);
    let d1 = (sum * 10) % 11;
    if (d1 === 10) d1 = 0;
    if (d1 !== Number(cpf[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i);
    let d2 = (sum * 10) % 11;
    if (d2 === 10) d2 = 0;
    return d2 === Number(cpf[10]);
  }

  // Validador por esquema (bem útil para forms)
  // schema: { field: [fn1, fn2...] } onde cada fn retorna "" se OK, ou string com erro
  function validateSchema(values = {}, schema = {}) {
    const errors = {};

    Object.entries(schema).forEach(([field, validators]) => {
      const v = values[field];
      for (const fn of validators || []) {
        const msg = fn(v, values);
        if (msg) {
          errors[field] = msg;
          break;
        }
      }
    });

    return { ok: Object.keys(errors).length === 0, errors };
  }

  // Helpers de mensagens (padrão)
  const msg = {
    required: "Campo obrigatório.",
    invalid: "Valor inválido.",
  };

  return {
    isRequired,
    minLen,
    maxLen,
    isNumber,
    isPositiveNumber,
    inList,
    isPhoneBR,
    isEmail,
    isCPF,
    validateSchema,
    msg,
  };
})();
