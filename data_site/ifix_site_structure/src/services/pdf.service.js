// src/services/pdf.service.js - VERSÃO MODULAR ES6
import { FormatService } from './format.service.js';

export const PDFService = (() => {
  const config = {
    companyName: 'iFix Assistência Técnica',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    companyWebsite: '',
    technicianSignatureLabel: 'Responsável Técnico',
    clientSignatureLabel: 'Assinatura do Cliente',
    terms: [
      'Garantia: 90 dias para mão de obra e 180 dias para peças, exceto desgaste natural.',
      'A garantia não cobre mau uso, quedas, líquidos ou modificações não autorizadas.',
      'Não nos responsabilizamos por dados/configurações perdidas durante o reparo. Recomendado fazer backup antes.',
      'Valores e prazos podem ser ajustados após diagnóstico técnico detalhado (orçamento inicial é estimativa).',
      'Equipamento não retirado após 30 dias pode estar sujeito a taxa de armazenamento (se aplicável).'
    ],
    footerText: 'Documento gerado automaticamente pelo sistema iFix. Este documento não é uma nota fiscal.'
  };

  function setConfig(overrides = {}) {
    Object.assign(config, overrides);
    return config;
  }

  // ====================== ORDEM DE SERVIÇO ======================
  async function generateOrder(order, options = {}) {
    const settings = { ...config, ...options };
    
    return {
      print: () => printOrder(order, settings),
      save: () => saveOrderAsPDF(order, settings),
      preview: () => previewOrder(order, settings),
      getHTML: () => buildOrderHTML(order, settings)
    };
  }

  async function generateOrdersReport(orders, options = {}) {
    const settings = { ...config, ...options };
    
    return {
      print: () => printOrdersReport(orders, settings),
      save: () => saveOrdersReportAsPDF(orders, settings),
      preview: () => previewOrdersReport(orders, settings),
      getHTML: () => buildOrdersReportHTML(orders, settings)
    };
  }

  // ====================== CATÁLOGO DE PREÇOS ======================
  async function generatePriceCatalog(prices, options = {}) {
    const settings = { ...config, ...options };
    
    return {
      print: () => printPriceCatalog(prices, settings),
      save: () => savePriceCatalogAsPDF(prices, settings),
      preview: () => previewPriceCatalog(prices, settings),
      getHTML: () => buildPriceCatalogHTML(prices, settings)
    };
  }

  // ====================== FUNÇÕES DE IMPRESSÃO ======================
  function printOrder(order, settings) {
    const html = buildOrderHTML(order, settings);
    openPrintWindow(html, `OS-${order.id}`);
  }

  function printOrdersReport(orders, settings) {
    const html = buildOrdersReportHTML(orders, settings);
    openPrintWindow(html, `Relatorio-OS-${new Date().toISOString().slice(0, 10)}`);
  }

  function printPriceCatalog(prices, settings) {
    const html = buildPriceCatalogHTML(prices, settings);
    openPrintWindow(html, `Catalogo-Precos-${new Date().toISOString().slice(0, 10)}`);
  }

  // ====================== FUNÇÕES DE SALVAR ======================
  function saveOrderAsPDF(order, settings) {
    const html = buildOrderHTML(order, settings);
    saveAsPDF(html, `OS-${order.id}-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  function saveOrdersReportAsPDF(orders, settings) {
    const html = buildOrdersReportHTML(orders, settings);
    saveAsPDF(html, `Relatorio-OS-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  function savePriceCatalogAsPDF(prices, settings) {
    const html = buildPriceCatalogHTML(prices, settings);
    saveAsPDF(html, `Catalogo-Precos-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  // ====================== FUNÇÕES DE PREVIEW ======================
  function previewOrder(order, settings) {
    const html = buildOrderHTML(order, settings);
    openPreviewWindow(html, `OS-${order.id}`);
  }

  function previewOrdersReport(orders, settings) {
    const html = buildOrdersReportHTML(orders, settings);
    openPreviewWindow(html, `Relatorio-OS-${new Date().toISOString().slice(0, 10)}`);
  }

  function previewPriceCatalog(prices, settings) {
    const html = buildPriceCatalogHTML(prices, settings);
    openPreviewWindow(html, `Catalogo-Precos-${new Date().toISOString().slice(0, 10)}`);
  }

  // ====================== BUILDERS DE HTML ======================
  function buildOrderHTML(order, settings) {
    const {
      companyName,
      companyAddress,
      companyPhone,
      companyEmail,
      companyWebsite,
      footerText,
      terms,
      technicianSignatureLabel,
      clientSignatureLabel
    } = settings;

    const safe = FormatService.safeHTML;
    const currency = FormatService.formatCurrency;
    const date = FormatService.formatDate;
    const phone = FormatService.formatPhone;

    const servicesTotal = Array.isArray(order.services) 
      ? order.services.reduce((sum, s) => sum + (s.price * s.quantity || 0), 0)
      : 0;

    const partsTotal = Array.isArray(order.parts) 
      ? order.parts.reduce((sum, p) => sum + (p.price * p.quantity || 0), 0)
      : 0;

    const subtotal = servicesTotal + partsTotal;
    const discount = order.discount || 0;
    const total = subtotal - discount;

    const servicesHTML = Array.isArray(order.services) && order.services.length > 0
      ? order.services.map(s => `
          <tr>
            <td>${safe(s.name)}</td>
            <td class="text-center">${s.quantity || 1}</td>
            <td class="text-right">${currency(s.price || 0)}</td>
            <td class="text-right">${currency((s.price || 0) * (s.quantity || 1))}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="4" class="text-center text-muted">Nenhum serviço registrado</td></tr>';

    const partsHTML = Array.isArray(order.parts) && order.parts.length > 0
      ? order.parts.map(p => `
          <tr>
            <td>${safe(p.name)}</td>
            <td>${safe(p.code || '-')}</td>
            <td class="text-center">${p.quantity || 1}</td>
            <td class="text-right">${currency(p.price || 0)}</td>
            <td class="text-right">${currency((p.price || 0) * (p.quantity || 1))}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="5" class="text-center text-muted">Nenhuma peça utilizada</td></tr>';

    const termLines = [
      ...(Array.isArray(terms) ? terms : []),
      ...(Array.isArray(order.terms) ? order.terms : [])
    ].filter(Boolean);

    const termsHTML = termLines.length
      ? termLines.map((t, idx) => `${idx + 1}. ${safe(t)}`).join('<br>')
      : 'Sem termos adicionais.';

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OS ${safe(order.id)} - ${companyName}</title>
        <style>
          /* Reset e base */
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background: #fff; }
          
          /* Layout da página */
          .page { max-width: 210mm; margin: 0 auto; padding: 20mm; }
          
          /* Cabeçalho */
          .header { border-bottom: 2px solid #2c3e50; padding-bottom: 15px; margin-bottom: 20px; }
          .company-info h1 { color: #2c3e50; font-size: 24px; margin-bottom: 5px; }
          .company-info .subtitle { color: #7f8c8d; font-size: 14px; }
          .company-contact { font-size: 12px; color: #555; margin-top: 10px; }
          
          /* Informações da OS */
          .order-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .info-box { border: 1px solid #ddd; border-radius: 5px; padding: 15px; }
          .info-box h3 { color: #2c3e50; font-size: 14px; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .info-item { margin-bottom: 8px; }
          .info-label { font-size: 12px; color: #7f8c8d; display: block; }
          .info-value { font-weight: 600; font-size: 13px; }
          
          /* Tabelas */
          .section { margin-bottom: 25px; }
          .section h4 { color: #2c3e50; font-size: 16px; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #eee; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          table th { background: #f8f9fa; color: #2c3e50; font-weight: 600; padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6; }
          table td { padding: 10px; border-bottom: 1px solid #dee2e6; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .text-muted { color: #6c757d; }
          
          /* Totais */
          .totals { width: 300px; margin-left: auto; margin-top: 20px; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #dee2e6; }
          .total-row.total-final { border-top: 2px solid #2c3e50; border-bottom: none; font-weight: 700; font-size: 16px; margin-top: 5px; }
          
          /* Problema e Observações */
          .problem-section, .observations-section { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .problem-section h4, .observations-section h4 { margin-top: 0; }
          
          /* Termos e Footer */
          .terms { font-size: 10px; color: #666; line-height: 1.4; margin-top: 30px; padding: 15px; border: 1px dashed #ddd; background: #fafafa; }
          .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 11px; color: #777; text-align: center; }
          
          /* Estilos de impressão */
          @media print {
            .page { padding: 0; margin: 0; }
            .no-print { display: none; }
            body { font-size: 12px; }
            table { page-break-inside: avoid; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <!-- Cabeçalho da empresa -->
          <div class="header">
            <div class="company-info">
              <h1>${safe(companyName)}</h1>
              <div class="subtitle">Ordem de Serviço</div>
              <div class="company-contact">
                ${safe(companyAddress)} | ${phone(companyPhone)} | ${safe(companyEmail)} | ${safe(companyWebsite)}
              </div>
            </div>
          </div>
          
          <!-- Informações da OS -->
          <div class="order-info">
            <div class="info-box">
              <h3>Dados da OS</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Número da OS</span>
                  <span class="info-value">#${safe(order.id)}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Data de Abertura</span>
                  <span class="info-value">${date(order.createdAt)}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Status</span>
                  <span class="info-value">${safe(order.status)}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Previsão de Entrega</span>
                  <span class="info-value">${order.estimatedDelivery ? date(order.estimatedDelivery) : 'Não definida'}</span>
                </div>
              </div>
            </div>
            
            <div class="info-box">
              <h3>Dados do Cliente</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Nome</span>
                  <span class="info-value">${safe(order.clientName)}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Telefone</span>
                  <span class="info-value">${phone(order.clientPhone)}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Email</span>
                  <span class="info-value">${safe(order.clientEmail || '-')}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">CPF/CNPJ</span>
                  <span class="info-value">${order.clientDocument ? FormatService.formatCPF(order.clientDocument) : '-'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Dados do Aparelho -->
          <div class="section">
            <h4>Aparelho</h4>
            <div class="info-box">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Marca</span>
                  <span class="info-value">${safe(order.deviceBrand || '-')}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Modelo</span>
                  <span class="info-value">${safe(order.deviceModel || '-')}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Número de Série</span>
                  <span class="info-value">${safe(order.deviceSerial || '-')}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Cor</span>
                  <span class="info-value">${safe(order.deviceColor || '-')}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Problema Relatado -->
          <div class="problem-section">
            <h4>Problema Relatado</h4>
            <p>${safe(order.problemDescription || 'Não informado.')}</p>
          </div>
          
          <!-- Serviços -->
          <div class="section">
            <h4>Serviços Executados</h4>
            <table>
              <thead>
                <tr>
                  <th>Serviço</th>
                  <th class="text-center">Qtd</th>
                  <th class="text-right">Valor Unitário</th>
                  <th class="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${servicesHTML}
              </tbody>
            </table>
          </div>
          
          <!-- Peças -->
          <div class="section">
            <h4>Peças Utilizadas</h4>
            <table>
              <thead>
                <tr>
                  <th>Peça</th>
                  <th>Código</th>
                  <th class="text-center">Qtd</th>
                  <th class="text-right">Valor Unitário</th>
                  <th class="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${partsHTML}
              </tbody>
            </table>
          </div>
          
          <!-- Totais -->
          <div class="totals">
            <div class="total-row">
              <span>Subtotal Serviços:</span>
              <span>${currency(servicesTotal)}</span>
            </div>
            <div class="total-row">
              <span>Subtotal Peças:</span>
              <span>${currency(partsTotal)}</span>
            </div>
            <div class="total-row">
              <span>Desconto:</span>
              <span>-${currency(discount)}</span>
            </div>
            <div class="total-row total-final">
              <span>Total:</span>
              <span>${currency(total)}</span>
            </div>
          </div>
          
          <!-- Observações -->
          ${order.observations ? `
            <div class="observations-section">
              <h4>Observações</h4>
              <p>${safe(order.observations)}</p>
            </div>
          ` : ''}
          
          <!-- Termos e Condições -->
          <div class="terms">
            <strong>Termos e Condições:</strong><br>
            ${termsHTML}
          </div>
          
          <!-- Assinaturas -->
          <div style="margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
            <div style="text-align: center;">
              <div style="border-top: 1px solid #000; width: 200px; margin: 20px auto 5px;"></div>
              <small>${safe(clientSignatureLabel || 'Assinatura do Cliente')}</small>
            </div>
            <div style="text-align: center;">
              <div style="border-top: 1px solid #000; width: 200px; margin: 20px auto 5px;"></div>
              <small>${safe(technicianSignatureLabel || 'Responsável Técnico')}</small>
            </div>
          </div>
          
          <!-- Rodapé -->
          <div class="footer">
            <div>${safe(footerText)}</div>
            <div style="margin-top: 5px;">Documento gerado em: ${date(new Date(), 'DD/MM/YYYY HH:mm:ss')}</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  function buildOrdersReportHTML(orders, settings) {
    const { companyName, footerText } = settings;
    const safe = FormatService.safeHTML;
    const currency = FormatService.formatCurrency;
    const date = FormatService.formatDate;

    // Calcular totais
    let totalOrders = 0;
    let totalValue = 0;
    const statusCount = {};

    orders.forEach(order => {
      totalOrders++;
      totalValue += order.total || 0;
      statusCount[order.status] = (statusCount[order.status] || 0) + 1;
    });

    const ordersHTML = orders.map(order => `
      <tr>
        <td>#${safe(order.id)}</td>
        <td>${date(order.createdAt)}</td>
        <td>${safe(order.clientName)}</td>
        <td>${safe(order.deviceBrand || '-')} ${safe(order.deviceModel || '')}</td>
        <td class="text-right">${currency(order.total || 0)}</td>
        <td><span class="badge status-${order.status.toLowerCase().replace(/\s+/g, '-')}">${safe(order.status)}</span></td>
      </tr>
    `).join('');

    const statusHTML = Object.entries(statusCount).map(([status, count]) => `
      <div class="status-item">
        <span class="status-label">${safe(status)}:</span>
        <span class="status-count">${count}</span>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relatório de OS - ${companyName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .page { max-width: 210mm; margin: 0 auto; padding: 20mm; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #2c3e50; margin-bottom: 5px; }
          .header .subtitle { color: #7f8c8d; font-size: 14px; }
          .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
          .summary-card { border: 1px solid #ddd; border-radius: 5px; padding: 15px; text-align: center; }
          .summary-value { font-size: 24px; font-weight: bold; color: #2c3e50; }
          .summary-label { font-size: 12px; color: #7f8c8d; }
          .status-summary { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
          .status-item { background: #f8f9fa; padding: 8px 15px; border-radius: 20px; font-size: 12px; }
          .status-label { color: #555; }
          .status-count { font-weight: bold; margin-left: 5px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 30px; }
          table th { background: #f8f9fa; color: #2c3e50; padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6; }
          table td { padding: 10px; border-bottom: 1px solid #dee2e6; }
          .badge { padding: 3px 8px; border-radius: 10px; font-size: 11px; }
          .status-aberta { background: #e3f2fd; color: #1976d2; }
          .status-em-andamento { background: #fff3e0; color: #f57c00; }
          .status-finalizada { background: #e8f5e9; color: #388e3c; }
          .status-entregue { background: #f3e5f5; color: #7b1fa2; }
          .status-cancelada { background: #ffebee; color: #d32f2f; }
          .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 11px; color: #777; text-align: center; }
          @media print { .page { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <h1>${safe(companyName)}</h1>
            <div class="subtitle">Relatório de Ordens de Serviço</div>
            <div>Período: ${date(new Date())}</div>
          </div>
          
          <div class="summary">
            <div class="summary-card">
              <div class="summary-value">${totalOrders}</div>
              <div class="summary-label">Total de OS</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">${currency(totalValue)}</div>
              <div class="summary-label">Valor Total</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">${currency(totalValue / totalOrders || 0)}</div>
              <div class="summary-label">Ticket Médio</div>
            </div>
          </div>
          
          <div class="status-summary">
            ${statusHTML}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>OS #</th>
                <th>Data</th>
                <th>Cliente</th>
                <th>Aparelho</th>
                <th class="text-right">Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${ordersHTML}
            </tbody>
          </table>
          
          <div class="footer">
            <div>${safe(footerText)}</div>
            <div>Gerado em: ${date(new Date(), 'DD/MM/YYYY HH:mm:ss')}</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  function buildPriceCatalogHTML(prices, settings) {
    const { companyName, footerText } = settings;
    const safe = FormatService.safeHTML;
    const currency = FormatService.formatCurrency;

    // Agrupar por marca
    const groupedByBrand = {};
    prices.forEach(price => {
      if (!groupedByBrand[price.brand]) {
        groupedByBrand[price.brand] = [];
      }
      groupedByBrand[price.brand].push(price);
    });

    const brandSections = Object.entries(groupedByBrand).map(([brand, brandPrices]) => {
      const pricesHTML = brandPrices.map(price => `
        <tr>
          <td>${safe(price.model || '-')}</td>
          <td>${safe(price.service)}</td>
          <td>${safe(price.category)}</td>
          <td class="text-right">${currency(price.price)}</td>
          <td class="text-right">${price.promoPrice ? currency(price.promoPrice) : '-'}</td>
          <td>${price.estimatedTime || 1} ${price.estimatedTime === 1 ? 'dia' : 'dias'}</td>
          <td>${price.active ? 'Ativo' : 'Inativo'}</td>
        </tr>
      `).join('');

      return `
        <div class="brand-section">
          <h3>${safe(brand)}</h3>
          <table>
            <thead>
              <tr>
                <th>Modelo</th>
                <th>Serviço</th>
                <th>Categoria</th>
                <th class="text-right">Preço</th>
                <th class="text-right">Promoção</th>
                <th>Tempo</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${pricesHTML}
            </tbody>
          </table>
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Catálogo de Preços - ${companyName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .page { max-width: 210mm; margin: 0 auto; padding: 20mm; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #2c3e50; margin-bottom: 5px; }
          .header .subtitle { color: #7f8c8d; font-size: 14px; }
          .brand-section { margin-bottom: 30px; }
          .brand-section h3 { background: #f8f9fa; padding: 10px; border-left: 4px solid #2c3e50; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
          table th { background: #f8f9fa; color: #2c3e50; padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6; }
          table td { padding: 10px; border-bottom: 1px solid #dee2e6; }
          .text-right { text-align: right; }
          .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 11px; color: #777; text-align: center; }
          @media print { .page { padding: 0; } .brand-section { page-break-inside: avoid; } }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <h1>${safe(companyName)}</h1>
            <div class="subtitle">Catálogo de Preços de Serviços</div>
            <div>Data de referência: ${FormatService.formatDate(new Date())}</div>
          </div>
          
          ${brandSections}
          
          <div class="footer">
            <div>${safe(footerText)}</div>
            <div>Total de serviços: ${prices.length} | Gerado em: ${FormatService.formatDate(new Date(), 'DD/MM/YYYY HH:mm:ss')}</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // ====================== UTILITÁRIOS ======================
  function openPrintWindow(html, title = 'Documento') {
    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir o documento.');
      return;
    }

    printWindow.document.write(html);
    printWindow.document.close();
    
    printWindow.focus();
    
    // Aguardar carregamento antes de imprimir
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  }

  function openPreviewWindow(html, title = 'Documento') {
    const previewWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    if (!previewWindow) {
      alert('Por favor, permita pop-ups para visualizar o documento.');
      return;
    }

    previewWindow.document.write(html);
    previewWindow.document.title = title;
    previewWindow.document.close();
    
    previewWindow.focus();
  }

  function saveAsPDF(html, filename) {
    try {
      // Usar jsPDF se disponível
      if (typeof window.jspdf !== 'undefined') {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // Converter HTML para PDF (simplificado)
        pdf.html(html, {
          callback: (pdf) => {
            pdf.save(filename);
          },
          margin: [10, 10, 10, 10],
          autoPaging: 'text',
          x: 0,
          y: 0,
          width: 190,
          windowWidth: 800
        });
      } else {
        // Fallback: abrir para impressão
        alert('Biblioteca jsPDF não encontrada. Abrindo para impressão. Use "Salvar como PDF" na impressora.');
        openPrintWindow(html, filename);
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Abrindo para impressão.');
      openPrintWindow(html, filename);
    }
  }

  // ====================== EXPORTAÇÃO ======================
  return {
    // Configuração
    config,
    setConfig,
    
    // Ordem de Serviço
    generateOrder,
    
    // Relatórios
    generateOrdersReport,
    generatePriceCatalog,
    
    // Funções diretas
    printOrder,
    printOrdersReport,
    printPriceCatalog,
    
    // Utilitários
    openPrintWindow,
    openPreviewWindow,
    saveAsPDF
  };
})();