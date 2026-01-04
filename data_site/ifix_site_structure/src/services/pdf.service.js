// pdf.service.js — geração de “PDF” via impressão
// Responsabilidade: montar HTML imprimível e abrir janela para salvar como PDF (Ctrl+P / Salvar como PDF)

window.PDFService = (function () {
  function printOS(os, { companyName = "iFix", footerText = "Documento gerado pelo sistema interno iFix." } = {}) {
    if (!os) throw new Error("PDFService.printOS: OS inválida.");

    const html = buildOSHtml(os, { companyName, footerText });
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) throw new Error("Popup bloqueado. Permita popups para imprimir.");

    w.document.open();
    w.document.write(html);
    w.document.close();

    // aguarda render básico
    setTimeout(() => {
      w.focus();
      w.print();
    }, 250);

    return true;
  }

  function buildOSHtml(os, { companyName, footerText } = {}) {
    const F = window.FormatService;

    const safe = (x) => (F?.safeText ? F.safeText(x) : escapeHtml(x));
    const brl = (x) => (F?.toBRL ? F.toBRL(x) : String(x ?? ""));
    const dt = (x) => (F?.toDateTimeBR ? F.toDateTimeBR(x) : String(x ?? ""));

    const items = Array.isArray(os.items) ? os.items : [];
    const subtotal = Number(os.subtotal ?? sumItems(items));
    const discount = Number(os.discount ?? 0);
    const total = Number(os.total ?? (subtotal - discount));

    const rows = items.length
      ? items.map((it) => `
          <tr>
            <td>${safe(it.name ?? "")}</td>
            <td class="t-right">${safe(it.qty ?? 1)}</td>
            <td class="t-right">${brl(it.price ?? 0)}</td>
            <td class="t-right">${brl(it.subtotal ?? (Number(it.price ?? 0) * Number(it.qty ?? 1)))}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="4" class="muted">Sem itens detalhados.</td></tr>`;

    return `
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>OS ${safe(os.id ?? "")} - ${safe(companyName)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; padding: 24px; }
    .sheet { max-width: 800px; margin: 0 auto; }
    .top { display: flex; justify-content: space-between; gap: 12px; }
    .brand { font-size: 20px; font-weight: 800; }
    .muted { color: #666; font-size: 12px; }
    .box { border: 1px solid #ddd; border-radius: 10px; padding: 14px; margin-top: 12px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .row { display: flex; justify-content: space-between; gap: 12px; }
    .label { font-size: 11px; color: #666; }
    .value { font-weight: 600; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border-bottom: 1px solid #eee; padding: 8px 6px; text-align: left; font-size: 12px; }
    th { background: #fafafa; }
    .t-right { text-align: right; }
    .totals { margin-top: 10px; width: 260px; margin-left: auto; }
    .totals .row { padding: 6px 0; }
    .hr { height: 1px; background: #eee; margin: 14px 0; }
    .terms { font-size: 11px; color: #333; line-height: 1.35; }
    @media print {
      body { padding: 0; }
      .sheet { max-width: none; padding: 18px; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="top">
      <div>
        <div class="brand">${safe(companyName)}</div>
        <div class="muted">Ordem de Serviço</div>
      </div>
      <div class="muted" style="text-align:right;">
        <div><strong>OS:</strong> ${safe(os.id ?? "")}</div>
        <div><strong>Aberta em:</strong> ${safe(dt(os.openedAt ?? ""))}</div>
        <div><strong>Status:</strong> ${safe(os.status ?? "")}</div>
      </div>
    </div>

    <div class="box">
      <div class="grid">
        <div>
          <div class="label">Cliente</div>
          <div class="value">${safe(os.customerName ?? "")}</div>
        </div>
        <div>
          <div class="label">Pagamento</div>
          <div class="value">${safe(os.paymentMethod ?? "")} ${os.paid ? "(Pago)" : ""}</div>
        </div>
        <div>
          <div class="label">Aparelho</div>
          <div class="value">${safe([os.deviceBrand, os.deviceModel].filter(Boolean).join(" "))}</div>
        </div>
        <div>
          <div class="label">IMEI / Serial</div>
          <div class="value">${safe(os.imei ?? "")}</div>
        </div>
      </div>

      <div class="hr"></div>

      <div>
        <div class="label">Problema relatado</div>
        <div class="value">${safe(os.problem ?? "")}</div>
      </div>

      <div style="margin-top:10px;">
        <div class="label">Observações</div>
        <div class="value">${safe(os.observations ?? "")}</div>
      </div>
    </div>

    <div class="box">
      <div class="label">Itens / Serviços</div>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th class="t-right">Qtd</th>
            <th class="t-right">Preço</th>
            <th class="t-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div class="totals">
        <div class="row"><div class="label">Subtotal</div><div class="value">${brl(subtotal)}</div></div>
        <div class="row"><div class="label">Desconto</div><div class="value">${brl(discount)}</div></div>
        <div class="row"><div class="label">Total</div><div class="value">${brl(total)}</div></div>
      </div>
    </div>

    <div class="box">
      <div class="label">Termos</div>
      <div class="terms">
        1) O valor pode sofrer alteração após diagnóstico técnico e confirmação de peças.<br/>
        2) Equipamento não retirado em até 90 dias poderá ser considerado abandono, conforme práticas comerciais locais.<br/>
        3) Dados e conteúdos do aparelho são responsabilidade do cliente; recomenda-se backup prévio.<br/>
        4) Garantia conforme descrição do serviço executado e condições do aparelho.
      </div>
      <div class="hr"></div>
      <div class="muted">${escapeHtml(footerText)}</div>
    </div>
  </div>
</body>
</html>
    `;
  }

  function sumItems(items) {
    if (!Array.isArray(items)) return 0;
    return items.reduce((acc, it) => acc + Number(it?.subtotal ?? (Number(it?.price ?? 0) * Number(it?.qty ?? 1))), 0);
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  return { printOS, buildOSHtml };
})();
