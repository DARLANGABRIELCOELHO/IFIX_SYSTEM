// form.js — builder de formulário (UI pura)
// Responsabilidade: gerar campos + extrair valores + validação simples (não é regra de negócio)

window.Form = (function () {
  function render({ fields = [], values = {}, onSubmit = null, submitLabel = "Salvar" } = {}) {
    const form = document.createElement("form");
    form.className = "c-form";
    form.setAttribute("autocomplete", "off");

    const grid = document.createElement("div");
    grid.className = "c-form__grid";

    fields.forEach((f) => {
      const field = buildField(f, values[f.name]);
      grid.appendChild(field);
    });

    const actions = document.createElement("div");
    actions.className = "c-form__actions";

    const btn = document.createElement("button");
    btn.type = "submit";
    btn.className = "c-btn c-btn--primary";
    btn.textContent = submitLabel;

    actions.appendChild(btn);

    form.appendChild(grid);
    form.appendChild(actions);

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const payload = getValues(form);
      const validation = validate(fields, payload);

      clearErrors(form);
      if (!validation.ok) {
        showErrors(form, validation.errors);
        return;
      }

      if (typeof onSubmit === "function") onSubmit(payload);
    });

    return form;
  }

  function buildField(field, value) {
    const wrap = document.createElement("div");
    wrap.className = "c-form__field";
    if (field.span) wrap.style.gridColumn = `span ${field.span}`;

    const label = document.createElement("label");
    label.className = "c-form__label";
    label.textContent = field.label ?? field.name;

    const input = createInput(field, value);
    input.classList.add("c-form__input");
    input.setAttribute("name", field.name);
    if (field.required) input.setAttribute("aria-required", "true");

    const error = document.createElement("div");
    error.className = "c-form__error";
    error.setAttribute("data-error-for", field.name);

    wrap.appendChild(label);
    wrap.appendChild(input);
    wrap.appendChild(error);

    return wrap;
  }

  function createInput(field, value) {
    const type = field.type ?? "text";

    if (type === "select") {
      const sel = document.createElement("select");
      (field.options ?? []).forEach((opt) => {
        const o = document.createElement("option");
        o.value = String(opt.value ?? opt);
        o.textContent = String(opt.label ?? opt);
        sel.appendChild(o);
      });
      if (value != null) sel.value = String(value);
      return sel;
    }

    if (type === "textarea") {
      const ta = document.createElement("textarea");
      ta.rows = field.rows ?? 4;
      if (value != null) ta.value = String(value);
      return ta;
    }

    const inp = document.createElement("input");
    inp.type = type;
    if (field.placeholder) inp.placeholder = field.placeholder;
    if (value != null) inp.value = String(value);
    return inp;
  }

  function getValues(formEl) {
    const data = {};
    const fd = new FormData(formEl);
    for (const [k, v] of fd.entries()) data[k] = v;
    return data;
  }

  function validate(fields, values) {
    const errors = {};
    fields.forEach((f) => {
      const v = values[f.name];

      if (f.required && String(v ?? "").trim() === "") {
        errors[f.name] = "Campo obrigatório.";
        return;
      }

      if (typeof f.validate === "function") {
        const msg = f.validate(v, values);
        if (msg) errors[f.name] = msg;
      }
    });

    return { ok: Object.keys(errors).length === 0, errors };
  }

  function clearErrors(formEl) {
    formEl.querySelectorAll("[data-error-for]").forEach((el) => (el.textContent = ""));
    formEl.querySelectorAll(".c-form__input").forEach((el) => el.classList.remove("has-error"));
  }

  function showErrors(formEl, errors) {
    Object.entries(errors).forEach(([name, msg]) => {
      const err = formEl.querySelector(`[data-error-for="${cssEscape(name)}"]`);
      const input = formEl.querySelector(`[name="${cssEscape(name)}"]`);
      if (err) err.textContent = msg;
      if (input) input.classList.add("has-error");
    });
  }

  function cssEscape(str) {
    return String(str ?? "").replaceAll('"', '\\"');
  }

  return { render, getValues, validate };
})();
