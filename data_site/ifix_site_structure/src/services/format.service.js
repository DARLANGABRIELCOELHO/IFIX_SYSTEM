// src/services/format.service.js - VERSÃO MODULAR ES6
export const FormatService = (() => {
  // ====================== MOEDA ======================
  function formatCurrency(value, currency = 'BRL') {
    const v = Number(value ?? 0);
    return v.toLocaleString('pt-BR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Parse de moeda BR (aceita "R$ 1.234,56", "1234,56", "1234.56").
   * Retorna number (NaN se inválido).
   */
  function parseCurrencyBRL(input) {
    if (input === null || input === undefined) return NaN;
    if (typeof input === 'number') return input;

    const s = String(input)
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^R\$\s*/i, '')
      .replace(/\./g, '')
      .replace(',', '.');

    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }

  function formatCurrencyCompact(value) {
    const v = Number(value ?? 0);
    if (v >= 1000000) {
      return `R$ ${(v / 1000000).toFixed(1)}M`;
    }
    if (v >= 1000) {
      return `R$ ${(v / 1000).toFixed(1)}K`;
    }
    return formatCurrency(v);
  }

  // ====================== DATAS ======================
  function formatDate(date, format = 'DD/MM/YYYY') {
    if (!date) return '';
    
    let d;
    if (date instanceof Date) {
      d = date;
    } else if (typeof date === 'string' || typeof date === 'number') {
      d = new Date(date);
    } else {
      return '';
    }

    if (isNaN(d.getTime())) return '';

    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const seconds = d.getSeconds().toString().padStart(2, '0');

    const formats = {
      'DD/MM/YYYY': `${day}/${month}/${year}`,
      'YYYY-MM-DD': `${year}-${month}-${day}`,
      'DD/MM/YY': `${day}/${month}/${year.toString().slice(-2)}`,
      'DD-MM-YYYY': `${day}-${month}-${year}`,
      'DD/MM/YYYY HH:mm': `${day}/${month}/${year} ${hours}:${minutes}`,
      'DD/MM/YYYY HH:mm:ss': `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`,
      'HH:mm': `${hours}:${minutes}`,
      'HH:mm:ss': `${hours}:${minutes}:${seconds}`,
      'ddd, DD/MM': `${getWeekdayShort(d)}, ${day}/${month}`,
      'full': d.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };

    return formats[format] || d.toLocaleDateString('pt-BR');
  }

  function formatRelativeDate(date) {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        if (diffMinutes === 0) return 'Agora mesmo';
        if (diffMinutes === 1) return '1 minuto atrás';
        return `${diffMinutes} minutos atrás`;
      }
      if (diffHours === 1) return '1 hora atrás';
      return `${diffHours} horas atrás`;
    }
    
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`;
    return `${Math.floor(diffDays / 365)} anos atrás`;
  }

  /**
   * Parse de data BR (DD/MM/YYYY) para Date. Retorna null se inválida.
   */
  function parseDateBR(input) {
    if (!input) return null;
    if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input;

    const s = String(input).trim();
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (!m) {
      const d = new Date(s);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    const day = Number(m[1]);
    const month = Number(m[2]);
    let year = Number(m[3]);
    if (year < 100) year += 2000;

    const d = new Date(year, month - 1, day);
    // validação (Date corrige overflow; precisamos checar)
    if (d.getFullYear() !== year || d.getMonth() !== (month - 1) || d.getDate() !== day) return null;
    return d;
  }

  /**
   * Date -> "YYYY-MM-DD" (útil para inputs type=date)
   */
  function toISODate(date) {
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function getWeekdayShort(date) {
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return weekdays[date.getDay()];
  }

  function getWeekdayLong(date) {
    const weekdays = [
      'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
      'Quinta-feira', 'Sexta-feira', 'Sábado'
    ];
    return weekdays[date.getDay()];
  }

  // ====================== NÚMEROS ======================
  function formatNumber(value, options = {}) {
    const v = Number(value);
    if (!Number.isFinite(v)) return options.fallback || '0';
    
    const {
      decimals = 2,
      separator = ',',
      thousandSeparator = '.',
      prefix = '',
      suffix = ''
    } = options;
    
    let formatted = v.toFixed(decimals);
    
    // Separador de milhar
    if (thousandSeparator) {
      formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
    }
    
    // Separador decimal
    if (separator !== '.') {
      formatted = formatted.replace('.', separator);
    }
    
    return `${prefix}${formatted}${suffix}`;
  }

  function formatPercent(value, decimals = 2) {
    const v = Number(value);
    if (!Number.isFinite(v)) return '0%';
    return `${v.toFixed(decimals)}%`;
  }

  // ====================== TEXTO ======================
  function capitalize(text) {
    if (!text) return '';
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  function truncate(text, maxLength = 50, suffix = '...') {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
  }

  function stripHTML(html) {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  }

  function normalizeText(text) {
    if (!text) return '';
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .toLowerCase()
      .trim();
  }

  // ====================== DOCUMENTOS ======================
  function formatCPF(cpf) {
    const digits = onlyDigits(cpf);
    if (digits.length !== 11) return cpf || '';
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  function formatCNPJ(cnpj) {
    const digits = onlyDigits(cnpj);
    if (digits.length !== 14) return cnpj || '';
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }

  function formatCEP(cep) {
    const digits = onlyDigits(cep);
    if (digits.length !== 8) return cep || '';
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }

  // ====================== TELEFONE ======================
  function formatPhone(phone) {
    const digits = onlyDigits(phone);
    
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    if (digits.length === 8) {
      return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    }
    if (digits.length === 9) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
    
    return phone || '';
  }

  /**
   * Normaliza para somente dígitos e limita a 11 (padrão BR). Útil para salvar/buscar.
   */
  function normalizePhoneBR(phone) {
    return onlyDigits(phone).slice(0, 11);
  }

  function formatPhoneWithDDI(phone) {
    const digits = onlyDigits(phone);
    if (digits.length >= 12) {
      return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
    }
    return formatPhone(phone);
  }

  // ====================== UTILITÁRIOS ======================
  function onlyDigits(value) {
    return String(value || '').replace(/\D+/g, '');
  }

  function safeHTML(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function pluralize(count, singular, plural = null) {
    if (count === 1) return `${count} ${singular}`;
    return `${count} ${plural || singular + 's'}`;
  }

  function formatFileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h${mins.toString().padStart(2, '0')}min`;
  }

  // ====================== MÁSCARAS DINÂMICAS ======================
  function applyMask(value, mask) {
    if (!value) return '';
    
    let result = '';
    let valueIndex = 0;
    
    for (let i = 0; i < mask.length && valueIndex < value.length; i++) {
      if (mask[i] === '#') {
        result += value[valueIndex];
        valueIndex++;
      } else {
        result += mask[i];
      }
    }
    
    return result;
  }

  function maskCPF(value) {
    return applyMask(onlyDigits(value).slice(0, 11), '###.###.###-##');
  }

  function maskCNPJ(value) {
    return applyMask(onlyDigits(value).slice(0, 14), '##.###.###/####-##');
  }

  function maskPhone(value) {
    const digits = onlyDigits(value);
    if (digits.length <= 10) {
      return applyMask(digits.slice(0, 10), '(##) ####-####');
    }
    return applyMask(digits.slice(0, 11), '(##) #####-####');
  }

  function maskCEP(value) {
    return applyMask(onlyDigits(value).slice(0, 8), '#####-###');
  }

  // ====================== VALIDAÇÕES BÁSICAS ======================
  function isValidDate(date) {
    if (!date) return false;
    const d = new Date(date);
    return !isNaN(d.getTime());
  }

  function isNumeric(value) {
    if (value === null || value === undefined) return false;
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

  function isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  // ====================== EXPORTAÇÃO ======================
  return {
    // Moeda
    formatCurrency,
    formatCurrencyCompact,
    parseCurrencyBRL,
    
    // Datas
    formatDate,
    formatRelativeDate,
    parseDateBR,
    toISODate,
    getWeekdayShort,
    getWeekdayLong,
    
    // Números
    formatNumber,
    formatPercent,
    
    // Texto
    capitalize,
    truncate,
    stripHTML,
    normalizeText,
    
    // Documentos
    formatCPF,
    formatCNPJ,
    formatCEP,
    
    // Telefone
    formatPhone,
    formatPhoneWithDDI,
    normalizePhoneBR,
    
    // Utilitários
    onlyDigits,
    safeHTML,
    nowISO,
    pluralize,
    formatFileSize,
    formatDuration,
    
    // Máscaras
    applyMask,
    maskCPF,
    maskCNPJ,
    maskPhone,
    maskCEP,
    
    // Validações
    isValidDate,
    isNumeric,
    isEmpty
  };
})();