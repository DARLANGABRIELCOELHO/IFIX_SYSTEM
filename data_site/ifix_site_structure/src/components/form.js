// form.js — builder de formulário melhorado
window.Form = (function () {
  function render({ 
    fields = [], 
    values = {}, 
    onSubmit = null, 
    submitLabel = "Salvar",
    cancelLabel = null,
    onCancel = null,
    liveValidation = false,
    disabled = false
  } = {}) {
    const form = document.createElement("form");
    form.className = "c-form";
    form.setAttribute("autocomplete", "off");
    if (disabled) form.classList.add("is-disabled");

    const grid = document.createElement("div");
    grid.className = "c-form__grid";

    fields.forEach((f) => {
      const field = buildField(f, values[f.name]);
      if (f.disabled || disabled) {
        const input = field.querySelector("input, select, textarea");
        if (input) input.disabled = true;
      }
      grid.appendChild(field);
    });

    const actions = document.createElement("div");
    actions.className = "c-form__actions";

    // Botão de cancelar (opcional)
    if (cancelLabel && typeof onCancel === "function") {
      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "c-btn c-btn--secondary";
      cancelBtn.textContent = cancelLabel;
      cancelBtn.addEventListener("click", onCancel);
      actions.appendChild(cancelBtn);
    }

    // Botão principal
    const submitBtn = document.createElement("button");
    submitBtn.type = "submit";
    submitBtn.className = "c-btn c-btn--primary";
    submitBtn.textContent = submitLabel;
    if (disabled) submitBtn.disabled = true;
    actions.appendChild(submitBtn);

    form.appendChild(grid);
    form.appendChild(actions);

    // Validação em tempo real
    if (liveValidation) {
      form.addEventListener("input", debounce((e) => {
        const fieldName = e.target.name;
        const field = fields.find(f => f.name === fieldName);
        if (field) {
          const formData = getValues(form);
          const validation = validateField(field, formData[fieldName], formData);
          showFieldError(form, fieldName, validation);
        }
      }, 300));
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (disabled) return;

      const payload = getValues(form);
      const validation = validate(fields, payload);

      clearErrors(form);
      if (!validation.ok) {
        showErrors(form, validation.errors);
        return;
      }

      if (typeof onSubmit === "function") {
        // Disabilita form durante submit
        submitBtn.disabled = true;
        submitBtn.textContent = "Salvando...";
        Promise.resolve(onSubmit(payload)).finally(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = submitLabel;
        });
      }
    });

    return form;
  }

  function buildField(field, value) {
    const wrap = document.createElement("div");
    wrap.className = `c-form__field ${field.type || "text"}`;
    if (field.span) wrap.style.gridColumn = `span ${field.span}`;
    if (field.className) wrap.classList.add(field.className);

    const label = document.createElement("label");
    label.className = "c-form__label";
    label.textContent = field.label ?? field.name;
    if (field.required) label.innerHTML += ' <span class="c-form__required">*</span>';

    const input = createInput(field, value);
    input.classList.add("c-form__input");
    input.setAttribute("name", field.name);
    if (field.placeholder) input.setAttribute("placeholder", field.placeholder);
    if (field.required) input.setAttribute("required", "true");
    if (field.disabled) input.disabled = true;

    const error = document.createElement("div");
    error.className = "c-form__error";
    error.setAttribute("data-error-for", field.name);

    const help = document.createElement("div");
    help.className = "c-form__help";
    if (field.help) help.textContent = field.help;

    wrap.appendChild(label);
    wrap.appendChild(input);
    wrap.appendChild(error);
    if (field.help) wrap.appendChild(help);

    return wrap;
  }

  function createInput(field, value) {
    const type = field.type ?? "text";
    const name = field.name;

    switch (type) {
      case "select":
        const sel = document.createElement("select");
        (field.options ?? []).forEach((opt) => {
          const o = document.createElement("option");
          o.value = String(opt.value ?? opt);
          o.textContent = String(opt.label ?? opt);
          if (opt.disabled) o.disabled = true;
          sel.appendChild(o);
        });
        if (value != null) sel.value = String(value);
        return sel;

      case "textarea":
        const ta = document.createElement("textarea");
        ta.rows = field.rows ?? 4;
        ta.cols = field.cols ?? 50;
        if (value != null) ta.value = String(value);
        return ta;

      case "checkbox":
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = Boolean(value);
        return checkbox;

      case "radio":
        const container = document.createElement("div");
        container.className = "c-form__radio-group";
        (field.options ?? []).forEach((opt) => {
          const label = document.createElement("label");
          label.className = "c-form__radio-label";
          
          const input = document.createElement("input");
          input.type = "radio";
          input.name = name;
          input.value = String(opt.value ?? opt);
          if (String(value) === input.value) input.checked = true;
          
          const span = document.createElement("span");
          span.textContent = String(opt.label ?? opt);
          
          label.appendChild(input);
          label.appendChild(span);
          container.appendChild(label);
        });
        return container;

      default:
        const inp = document.createElement("input");
        inp.type = type;
        if (field.min) inp.min = field.min;
        if (field.max) inp.max = field.max;
        if (field.step) inp.step = field.step;
        if (field.pattern) inp.pattern = field.pattern;
        if (value != null) inp.value = String(value);
        return inp;
    }
  }

  function getValues(formEl) {
    const data = {};
    const fd = new FormData(formEl);
    
    for (const [k, v] of fd.entries()) {
      // Para checkboxes boolean
      if (formEl.querySelector(`[name="${k}"][type="checkbox"]`)) {
        data[k] = v === "on";
      } else {
        data[k] = v;
      }
    }
    
    return data;
  }

  function validate(fields, values) {
    const errors = {};
    
    fields.forEach((f) => {
      const v = values[f.name];
      const error = validateField(f, v, values);
      if (error) errors[f.name] = error;
    });

    return { ok: Object.keys(errors).length === 0, errors };
  }

  function validateField(field, value, allValues) {
    const v = String(value ?? "").trim();
    
    if (field.required && v === "") {
      return "Campo obrigatório.";
    }
    
    if (typeof field.validate === "function") {
      return field.validate(value, allValues);
    }
    
    if (field.pattern && v && !new RegExp(field.pattern).test(v)) {
      return field.errorMessage || "Formato inválido.";
    }
    
    if (field.type === "email" && v && !/\S+@\S+\.\S+/.test(v)) {
      return "Email inválido.";
    }
    
    return null;
  }

  function clearErrors(formEl) {
    formEl.querySelectorAll("[data-error-for]").forEach((el) => {
      el.textContent = "";
      el.previousElementSibling?.classList.remove("has-error");
    });
  }

  function showFieldError(formEl, fieldName, error) {
    const err = formEl.querySelector(`[data-error-for="${cssEscape(fieldName)}"]`);
    const input = formEl.querySelector(`[name="${cssEscape(fieldName)}"]`);
    
    if (err) err.textContent = error || "";
    if (input) input.classList.toggle("has-error", !!error);
  }

  function showErrors(formEl, errors) {
    Object.entries(errors).forEach(([name, msg]) => {
      showFieldError(formEl, name, msg);
    });
  }

  function debounce(fn, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  }

  function cssEscape(str) {
    return String(str ?? "").replaceAll('"', '\\"');
  }

  return { 
    render, 
    getValues, 
    validate,
    validateField,
    clearErrors,
    showErrors
  };
})();