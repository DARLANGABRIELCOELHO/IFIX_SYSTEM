// form.js — Form Component for iFix Web App
// Follows project principles and CSS guidelines from README

window.Form = (function () {
  'use strict';

  const VERSION = '2.0.0';

  /**
   * Main Form render function
   * @param {Object} config - Form configuration
   * @param {Array} config.fields - Array of field definitions
   * @param {Object} config.values - Initial values for fields
   * @param {Function} config.onSubmit - Submit callback
   * @param {string} config.submitLabel - Submit button text
   * @param {string} config.cancelLabel - Cancel button text (optional)
   * @param {Function} config.onCancel - Cancel callback (optional)
   * @param {boolean} config.liveValidation - Enable live validation
   * @param {boolean} config.disabled - Disable entire form
   * @param {boolean} config.loading - Show loading state
   * @param {Function} config.validateService - External validation service (optional)
   * @returns {HTMLFormElement} Form element
   */
  function render({
    fields = [],
    values = {},
    onSubmit = null,
    submitLabel = 'Salvar',
    cancelLabel = null,
    onCancel = null,
    liveValidation = false,
    disabled = false,
    loading = false,
    validateService = null
  } = {}) {
    const form = document.createElement('form');
    form.className = 'form';
    if (disabled) form.classList.add('is-disabled');
    if (loading) form.classList.add('is-loading');
    form.setAttribute('autocomplete', 'off');

    // Build form structure
    form.appendChild(createFieldsContainer(fields, values, disabled));
    form.appendChild(createActionsContainer(cancelLabel, onCancel, submitLabel, disabled || loading));

    // Setup form behavior
    setupFormBehavior(form, fields, onSubmit, liveValidation, validateService);

    return form;
  }

  /**
   * Create container for all form fields
   */
  function createFieldsContainer(fields, values, disabled) {
    const container = document.createElement('div');
    container.className = 'form-fields';

    fields.forEach(field => {
      container.appendChild(createField(field, values[field.name], disabled));
    });

    return container;
  }

  /**
   * Create a single form field
   */
  function createField(fieldDef, value, formDisabled) {
    const fieldGroup = document.createElement('div');
    fieldGroup.className = 'form-group';

    // Add span class if specified (for grid layout)
    if (fieldDef.span) {
      fieldGroup.classList.add(`form-group--span-${fieldDef.span}`);
    }

    // Add custom class if specified
    if (fieldDef.className) {
      fieldGroup.classList.add(fieldDef.className);
    }

    // Field label
    const label = document.createElement('label');
    label.className = 'form-label';
    label.textContent = fieldDef.label || fieldDef.name;
    if (fieldDef.required) {
      const requiredSpan = document.createElement('span');
      requiredSpan.className = 'form-required';
      requiredSpan.textContent = ' *';
      label.appendChild(requiredSpan);
    }

    // Input element
    const input = createInputElement(fieldDef, value, formDisabled || fieldDef.disabled);

    // Error container
    const error = document.createElement('div');
    error.className = 'form-error';
    error.setAttribute('data-error-for', fieldDef.name);

    // Help text
    let helpText = null;
    if (fieldDef.help) {
      helpText = document.createElement('div');
      helpText.className = 'form-help';
      helpText.textContent = fieldDef.help;
    }

    // Assemble field
    fieldGroup.appendChild(label);
    fieldGroup.appendChild(input);
    fieldGroup.appendChild(error);
    if (helpText) fieldGroup.appendChild(helpText);

    return fieldGroup;
  }

  /**
   * Create input element based on field type
   */
  function createInputElement(fieldDef, value, isDisabled) {
    const type = fieldDef.type || 'text';

    switch (type) {
      case 'select':
        const select = document.createElement('select');
        (fieldDef.options || []).forEach(option => {
          const opt = document.createElement('option');
          opt.value = option.value !== undefined ? String(option.value) : String(option);
          opt.textContent = option.label !== undefined ? String(option.label) : String(option);
          if (option.disabled) opt.disabled = true;
          select.appendChild(opt);
        });
        if (value !== undefined) select.value = String(value);
        if (isDisabled) select.disabled = true;
        if (fieldDef.placeholder) select.setAttribute('placeholder', fieldDef.placeholder);
        return select;

      case 'textarea':
        const textarea = document.createElement('textarea');
        textarea.rows = fieldDef.rows || 4;
        if (value !== undefined) textarea.value = String(value);
        if (isDisabled) textarea.disabled = true;
        if (fieldDef.placeholder) textarea.setAttribute('placeholder', fieldDef.placeholder);
        return textarea;

      case 'checkbox':
        const container = document.createElement('div');
        container.className = 'checkbox-wrapper';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = Boolean(value);
        if (isDisabled) checkbox.disabled = true;
        
        const checkboxLabel = document.createElement('label');
        checkboxLabel.className = 'checkbox-label';
        checkboxLabel.textContent = fieldDef.label || fieldDef.name;
        
        container.appendChild(checkbox);
        container.appendChild(checkboxLabel);
        return container;

      case 'radio':
        const radioContainer = document.createElement('div');
        radioContainer.className = 'radio-group';
        
        (fieldDef.options || []).forEach(option => {
          const radioWrapper = document.createElement('label');
          radioWrapper.className = 'radio-wrapper';
          
          const radio = document.createElement('input');
          radio.type = 'radio';
          radio.name = fieldDef.name;
          radio.value = String(option.value !== undefined ? option.value : option);
          if (String(value) === radio.value) radio.checked = true;
          if (isDisabled) radio.disabled = true;
          
          const radioLabel = document.createElement('span');
          radioLabel.className = 'radio-label';
          radioLabel.textContent = String(option.label !== undefined ? option.label : option);
          
          radioWrapper.appendChild(radio);
          radioWrapper.appendChild(radioLabel);
          radioContainer.appendChild(radioWrapper);
        });
        
        return radioContainer;

      default:
        const input = document.createElement('input');
        input.type = type;
        input.className = 'form-control';
        input.name = fieldDef.name;
        
        if (value !== undefined) input.value = String(value);
        if (isDisabled) input.disabled = true;
        if (fieldDef.placeholder) input.setAttribute('placeholder', fieldDef.placeholder);
        if (fieldDef.required) input.required = true;
        if (fieldDef.pattern) input.pattern = fieldDef.pattern;
        if (fieldDef.min !== undefined) input.min = fieldDef.min;
        if (fieldDef.max !== undefined) input.max = fieldDef.max;
        if (fieldDef.step !== undefined) input.step = fieldDef.step;
        
        return input;
    }
  }

  /**
   * Create form actions container (buttons)
   */
  function createActionsContainer(cancelLabel, onCancel, submitLabel, isDisabled) {
    const actions = document.createElement('div');
    actions.className = 'form-actions';

    // Cancel button (optional)
    if (cancelLabel && typeof onCancel === 'function') {
      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'btn btn--secondary';
      cancelBtn.textContent = cancelLabel;
      cancelBtn.addEventListener('click', onCancel);
      actions.appendChild(cancelBtn);
    }

    // Submit button
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'btn btn--primary';
    submitBtn.textContent = submitLabel;
    if (isDisabled) submitBtn.disabled = true;
    actions.appendChild(submitBtn);

    return actions;
  }

  /**
   * Setup form event handlers and validation
   */
  function setupFormBehavior(form, fields, onSubmit, liveValidation, validateService) {
    // Live validation (with debounce)
    if (liveValidation) {
      form.addEventListener('input', debounce((e) => {
        const fieldName = e.target.name || e.target.getAttribute('name');
        if (!fieldName) return;
        
        const field = fields.find(f => f.name === fieldName);
        if (!field) return;
        
        const formData = getValues(form);
        const validation = validateField(field, formData[fieldName], formData, validateService);
        showFieldError(form, fieldName, validation);
      }, 300));
    }

    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Check if form is disabled
      if (form.classList.contains('is-disabled')) return;
      
      // Set loading state
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Salvando...';
      
      try {
        // Get form values
        const formData = getValues(form);
        
        // Validate all fields
        clearErrors(form);
        const validation = validateForm(fields, formData, validateService);
        
        if (!validation.ok) {
          showErrors(form, validation.errors);
          return;
        }
        
        // Call onSubmit if provided
        if (typeof onSubmit === 'function') {
          await Promise.resolve(onSubmit(formData));
        }
      } finally {
        // Restore button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  /**
   * Get form values as plain object
   */
  function getValues(form) {
    const data = {};
    const formData = new FormData(form);
    
    for (const [key, value] of formData.entries()) {
      // Handle checkboxes
      const input = form.querySelector(`[name="${key}"]`);
      if (input && input.type === 'checkbox') {
        data[key] = value === 'on';
      } else {
        data[key] = value;
      }
    }
    
    return data;
  }

  /**
   * Validate a single field
   */
  function validateField(field, value, allValues, validateService) {
    // Use external validation service if provided
    if (validateService && typeof validateService.validateField === 'function') {
      return validateService.validateField(field, value, allValues);
    }
    
    // Default validation
    const v = String(value || '').trim();
    
    if (field.required && !v) {
      return 'Campo obrigatório.';
    }
    
    if (field.pattern && v && !new RegExp(field.pattern).test(v)) {
      return field.errorMessage || 'Formato inválido.';
    }
    
    if (field.type === 'email' && v && !/\S+@\S+\.\S+/.test(v)) {
      return 'Email inválido.';
    }
    
    if (typeof field.validate === 'function') {
      return field.validate(value, allValues);
    }
    
    return null;
  }

  /**
   * Validate entire form
   */
  function validateForm(fields, values, validateService) {
    const errors = {};
    
    fields.forEach(field => {
      const error = validateField(field, values[field.name], values, validateService);
      if (error) errors[field.name] = error;
    });
    
    return {
      ok: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Clear all errors in form
   */
  function clearErrors(form) {
    form.querySelectorAll('[data-error-for]').forEach(el => {
      el.textContent = '';
    });
    form.querySelectorAll('.has-error').forEach(el => {
      el.classList.remove('has-error');
    });
  }

  /**
   * Show error for a specific field
   */
  function showFieldError(form, fieldName, error) {
    const errorEl = form.querySelector(`[data-error-for="${fieldName}"]`);
    const input = form.querySelector(`[name="${fieldName}"]`);
    
    if (errorEl) errorEl.textContent = error || '';
    if (input) input.classList.toggle('has-error', !!error);
  }

  /**
   * Show multiple errors
   */
  function showErrors(form, errors) {
    Object.entries(errors).forEach(([fieldName, error]) => {
      showFieldError(form, fieldName, error);
    });
  }

  /**
   * Utility: debounce function
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Utility: escape HTML for data attributes
   */
  function cssEscape(str) {
    return String(str || '').replace(/"/g, '\\"');
  }

  // Public API
  return {
    render,
    getValues,
    validate: validateForm,
    validateField,
    clearErrors,
    showErrors,
    version: VERSION
  };
})();