// src/services/validate.service.js - VERSÃO MODULAR ES6
export const ValidateService = (() => {
  // ====================== VALIDAÇÕES BÁSICAS ======================
  function isRequired(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  }

  function minLength(value, min) {
    if (value === null || value === undefined) return false;
    return String(value).length >= min;
  }

  function maxLength(value, max) {
    if (value === null || value === undefined) return true;
    return String(value).length <= max;
  }

  function exactLength(value, length) {
    if (value === null || value === undefined) return false;
    return String(value).length === length;
  }

  function isEmail(value) {
    if (!value) return false;
    const email = String(value).trim();
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  function isNumeric(value) {
    if (value === null || value === undefined) return false;
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

  function isInteger(value) {
    if (value === null || value === undefined) return false;
    return Number.isInteger(Number(value));
  }

  function isPositive(value) {
    if (!isNumeric(value)) return false;
    return Number(value) > 0;
  }

  function isNonNegative(value) {
    if (!isNumeric(value)) return false;
    return Number(value) >= 0;
  }

  // ====================== VALIDAÇÕES BRASILEIRAS ======================
  function isCPF(cpf) {
    if (!cpf) return false;
    
    const digits = String(cpf).replace(/\D/g, '');
    if (digits.length !== 11) return false;
    
    // CPFs com todos dígitos iguais são inválidos
    if (/^(\d)\1{10}$/.test(digits)) return false;
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(digits.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(digits.charAt(9))) return false;
    
    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(digits.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(digits.charAt(10))) return false;
    
    return true;
  }

  function isCNPJ(cnpj) {
    if (!cnpj) return false;
    
    const digits = String(cnpj).replace(/\D/g, '');
    if (digits.length !== 14) return false;
    
    // CNPJs com todos dígitos iguais são inválidos
    if (/^(\d)\1{13}$/.test(digits)) return false;
    
    // Validação do primeiro dígito verificador
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(digits.charAt(i)) * weights1[i];
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (digit1 !== parseInt(digits.charAt(12))) return false;
    
    // Validação do segundo dígito verificador
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(digits.charAt(i)) * weights2[i];
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    if (digit2 !== parseInt(digits.charAt(13))) return false;
    
    return true;
  }

  function isCPForCNPJ(value) {
    return isCPF(value) || isCNPJ(value);
  }

  function isPhoneBR(phone) {
    if (!phone) return false;
    const digits = String(phone).replace(/\D/g, '');
    return digits.length === 10 || digits.length === 11;
  }

  function isCEP(cep) {
    if (!cep) return false;
    const digits = String(cep).replace(/\D/g, '');
    return digits.length === 8;
  }

  // ====================== VALIDAÇÕES DE DATA ======================
  function isDate(value) {
    if (!value) return false;
    
    const date = new Date(value);
    if (isNaN(date.getTime())) return false;
    
    return true;
  }

  function isFutureDate(value) {
    if (!isDate(value)) return false;
    
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return date > today;
  }

  function isPastDate(value) {
    if (!isDate(value)) return false;
    
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return date < today;
  }

  function isDateBetween(value, start, end) {
    if (!isDate(value) || !isDate(start) || !isDate(end)) return false;
    
    const date = new Date(value);
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    return date >= startDate && date <= endDate;
  }

  function isAgeOver(value, minAge) {
    if (!isDate(value)) return false;
    
    const birthDate = new Date(value);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age >= minAge;
  }

  // ====================== VALIDAÇÕES DE DOMÍNIO ESPECÍFICO ======================
  function isStatusValid(status, validStatuses = []) {
    if (!status) return false;
    return validStatuses.includes(status.toUpperCase());
  }

  function isPaymentMethodValid(method, validMethods = []) {
    if (!method) return false;
    return validMethods.includes(method.toUpperCase());
  }

  function isPriorityValid(priority, validPriorities = []) {
    if (!priority) return false;
    return validPriorities.includes(priority.toUpperCase());
  }

  function isDeviceTypeValid(type, validTypes = []) {
    if (!type) return false;
    return validTypes.includes(type.toUpperCase());
  }

  // ====================== VALIDAÇÕES DE ARQUIVO ======================
  function isFileTypeValid(file, allowedTypes = []) {
    if (!file) return false;
    
    const extension = file.name.split('.').pop().toLowerCase();
    return allowedTypes.includes(`.${extension}`);
  }

  function isFileSizeValid(file, maxSizeMB = 10) {
    if (!file) return false;
    
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }

  // ====================== VALIDAÇÕES DE SENHA ======================
  function isPasswordStrong(password) {
    if (!password) return false;
    
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return hasMinLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  }

  function passwordsMatch(password, confirmPassword) {
    if (!password || !confirmPassword) return false;
    return password === confirmPassword;
  }

  // ====================== VALIDAÇÕES DE URL ======================
  function isURL(value) {
    if (!value) return false;
    
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  // ====================== SCHEMA VALIDATION ======================
  function validateSchema(data, schema) {
    const errors = {};
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      
      for (const rule of rules) {
        const error = rule(value, data);
        if (error) {
          errors[field] = error;
          break; // Apenas um erro por campo
        }
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // ====================== RULE BUILDERS ======================
  function required(message = 'Este campo é obrigatório') {
    return (value) => isRequired(value) ? null : message;
  }

  function minLengthRule(min, message = `Mínimo de ${min} caracteres`) {
    return (value) => minLength(value, min) ? null : message;
  }

  function maxLengthRule(max, message = `Máximo de ${max} caracteres`) {
    return (value) => maxLength(value, max) ? null : message;
  }

  function email(message = 'Email inválido') {
    return (value) => isEmail(value) ? null : message;
  }

  function numeric(message = 'Deve ser um número') {
    return (value) => isNumeric(value) ? null : message;
  }

  function positive(message = 'Deve ser maior que zero') {
    return (value) => isPositive(value) ? null : message;
  }

  function cpf(message = 'CPF inválido') {
    return (value) => isCPF(value) ? null : message;
  }

  function cnpj(message = 'CNPJ inválido') {
    return (value) => isCNPJ(value) ? null : message;
  }

  function phone(message = 'Telefone inválido') {
    return (value) => isPhoneBR(value) ? null : message;
  }

  function cep(message = 'CEP inválido') {
    return (value) => isCEP(value) ? null : message;
  }

  function dateRule(message = 'Data inválida') {
    return (value) => isDate(value) ? null : message;
  }

  function futureDate(message = 'Data deve ser futura') {
    return (value) => isFutureDate(value) ? null : message;
  }

  function pastDate(message = 'Data deve ser passada') {
    return (value) => isPastDate(value) ? null : message;
  }

  function inList(list, message = 'Valor inválido') {
    return (value) => list.includes(value) ? null : message;
  }

  // ====================== UTILITÁRIOS ======================
  function cleanDocument(document) {
    if (!document) return '';
    return String(document).replace(/\D/g, '');
  }

  function cleanPhone(phone) {
    if (!phone) return '';
    return String(phone).replace(/\D/g, '');
  }

  function cleanCEP(cep) {
    if (!cep) return '';
    return String(cep).replace(/\D/g, '');
  }

  // ====================== EXPORTAÇÃO ======================
  return {
    // Validações básicas
    isRequired,
    minLength,
    maxLength,
    exactLength,
    isEmail,
    isNumeric,
    isInteger,
    isPositive,
    isNonNegative,
    
    // Validações brasileiras
    isCPF,
    isCNPJ,
    isCPForCNPJ,
    isPhoneBR,
    isCEP,
    
    // Validações de data
    isDate,
    isFutureDate,
    isPastDate,
    isDateBetween,
    isAgeOver,
    
    // Validações de domínio
    isStatusValid,
    isPaymentMethodValid,
    isPriorityValid,
    isDeviceTypeValid,
    
    // Validações de arquivo
    isFileTypeValid,
    isFileSizeValid,
    
    // Validações de senha
    isPasswordStrong,
    passwordsMatch,
    
    // Validações de URL
    isURL,
    
    // Schema validation
    validateSchema,
    
    // Rule builders
    required,
    minLengthRule,
    maxLengthRule,
    email,
    numeric,
    positive,
    cpf,
    cnpj,
    phone,
    cep,
    dateRule,
    futureDate,
    pastDate,
    inList,
    
    // Utilitários
    cleanDocument,
    cleanPhone,
    cleanCEP
  };
})();