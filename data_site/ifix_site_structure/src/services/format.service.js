// format.service.js — padronização de apresentação (UI/relatórios)
// Responsabilidade: formatar moeda, datas, números, texto e campos comuns (tel, cpf)

window.FormatService = (function () {
  function toBRL(value) {
    const v = Number(value ?? 0);
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function toNumber(value, fallback = 0) {
    const v = Number(value);
    return Number.isFinite(v) ? v : fallback;
  }

  function toPercent(value, digits = 2) {
    const v = toNumber(value, 0);
    return `${v.toFixed(digits)}%`;
  }

  function toDateBR(isoOrDate) {
    if (!isoOrDate) return "";
    const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("pt-BR");
  }

  function toDateTimeBR(isoOrDate) {
    if (!isoOrDate) return "";
    const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("pt-BR");
  }

  function onlyDigits(str) {
    return String(str ?? "").replace(/\D+/g, "");
  }

  function capitalize(str) {
    const s = String(str ?? "").trim();
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function upper(str) {
    return String(str ?? "").toUpperCase();
  }

  function lower(str) {
    return String(str ?? "").toLowerCase();
  }

  function truncate(str, max = 40) {
    const s = String(str ?? "");
    return s.length > max ? s.slice(0, max - 1) + "…" : s;
  }

  function phoneBR(str) {
    const d = onlyDigits(str);
    // (11) 91234-5678 ou (11) 1234-5678
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return str ? String(str) : "";
  }

  function cpfBR(str) {
    const d = onlyDigits(str);
    if (d.length !== 11) return str ? String(str) : "";
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }

  function safeText(str) {
    // evita quebra de layout em impressão e UI
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  return {
    toBRL,
    toNumber,
    toPercent,
    toDateBR,
    toDateTimeBR,
    onlyDigits,
    capitalize,
    upper,
    lower,
    truncate,
    phoneBR,
    cpfBR,
    safeText,
  };
})();
