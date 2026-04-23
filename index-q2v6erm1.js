// src/modules/storage.js
var KEYS = {
  company: "company_config",
  notes: "sale_notes",
  counter: "sale_note_counter"
};
function getCompanyConfig() {
  return JSON.parse(localStorage.getItem(KEYS.company) || "{}");
}
function saveCompanyConfig(data) {
  localStorage.setItem(KEYS.company, JSON.stringify(data));
}
function getNotes() {
  return JSON.parse(localStorage.getItem(KEYS.notes) || "[]");
}
function getNextFolio(previewOnly = false) {
  const raw = Number(localStorage.getItem(KEYS.counter) || "1");
  if (!previewOnly) {
    localStorage.setItem(KEYS.counter, String(raw + 1));
  }
  return `NV-${String(raw).padStart(4, "0")}`;
}

// src/modules/utils.js
function formatCurrency(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN"
  }).format(Number(value || 0));
}
function formatDateInput(date) {
  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}
function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
var UNITS = [
  "cero",
  "uno",
  "dos",
  "tres",
  "cuatro",
  "cinco",
  "seis",
  "siete",
  "ocho",
  "nueve",
  "diez",
  "once",
  "doce",
  "trece",
  "catorce",
  "quince",
  "dieciséis",
  "diecisiete",
  "dieciocho",
  "diecinueve",
  "veinte"
];
var TENS = [
  "",
  "",
  "veinti",
  "treinta",
  "cuarenta",
  "cincuenta",
  "sesenta",
  "setenta",
  "ochenta",
  "noventa"
];
var HUNDREDS = [
  "",
  "ciento",
  "doscientos",
  "trescientos",
  "cuatrocientos",
  "quinientos",
  "seiscientos",
  "setecientos",
  "ochocientos",
  "novecientos"
];
function underHundred(n) {
  if (n <= 20)
    return UNITS[n];
  if (n < 30)
    return `${TENS[2]}${UNITS[n - 20]}`;
  const ten = Math.floor(n / 10);
  const unit = n % 10;
  return unit ? `${TENS[ten]} y ${UNITS[unit]}` : TENS[ten];
}
function underThousand(n) {
  if (n === 0)
    return "cero";
  if (n === 100)
    return "cien";
  if (n < 100)
    return underHundred(n);
  const hundred = Math.floor(n / 100);
  const remainder = n % 100;
  return remainder ? `${HUNDREDS[hundred]} ${underHundred(remainder)}` : HUNDREDS[hundred];
}
function numberToSpanishWords(value) {
  const num = Number(value || 0);
  const amount = Math.floor(num);
  const cents = Math.round((num - amount) * 100);
  let words = "";
  if (amount === 0)
    words = "cero";
  else if (amount < 1000)
    words = underThousand(amount);
  else {
    const thousands = Math.floor(amount / 1000);
    const remainder = amount % 1000;
    if (thousands === 1)
      words = "mil";
    else if (thousands < 1000)
      words = `${underThousand(thousands)} mil`;
    else
      words = String(amount);
    if (remainder)
      words += ` ${underThousand(remainder)}`;
  }
  if (cents > 0) {
    return `${words} con ${cents} centavos `;
  }
  return `${words}`;
}

// src/main.js
var app = document.querySelector("#app");
var EMPTY_ROWS = 10;
function createInitialState() {
  return {
    folio: getNextFolio(true),
    date: formatDateInput(new Date),
    customerName: "",
    deliveryDate: "",
    attendant: "",
    customerPhone: "",
    customerAddress: "",
    customerRfc: "",
    colony: "",
    city: "",
    customerEmail: "",
    paymentMethod: "Efectivo",
    discount: 0,
    applyTax: true,
    taxRate: 0.16,
    advance: 0,
    items: [
      { qty: 1, description: "", unitPrice: 0 },
      { qty: 1, description: "", unitPrice: 0 },
      { qty: 1, description: "", unitPrice: 0 },
      { qty: 1, description: "", unitPrice: 0 },
      { qty: 1, description: "", unitPrice: 0 }
    ]
  };
}
var defaultCompany = {
  businessName: "Kevin Gadir Godoy Castro",
  subtitle: "CENFER FERRETERIA",
  rfc: "GOCK0106257K4",
  address: "Poste 14, El Vergel, Navolato, Sinaloa, C.P. 80338",
  phone: "",
  email: "elvergelcenfer@gmail.com",
  website: "",
  footerMessage: "La informacion proporcionada en esta nota de venta es precisa y verdadera en el momento de su emision. Nos reservamos el derecho de corregir cualquier error o inexactitud.",
  logo: ""
};
var state = createInitialState();
var company = { ...defaultCompany, ...getCompanyConfig() };
var notes = getNotes();
function calcAmount(item) {
  return Number(item.qty || 0) * Number(item.unitPrice || 0);
}
function getFilledItems() {
  return state.items.filter((item) => item.description.trim() || Number(item.qty) > 0 || Number(item.unitPrice) > 0);
}
function calcSubtotal() {
  return getFilledItems().reduce((sum, item) => sum + calcAmount(item), 0);
}
function calcTaxableBase() {
  return Math.max(0, calcSubtotal() - Number(state.discount || 0));
}
function calcTax() {
  return state.applyTax ? calcTaxableBase() * Number(state.taxRate || 0) : 0;
}
function calcTotal() {
  return Math.max(0, calcTaxableBase() + calcTax() - Number(state.advance || 0));
}
function lineRows() {
  const rows = state.items.map((item, index) => ({ item, index, filled: true }));
  while (rows.length < EMPTY_ROWS) {
    rows.push({ item: { qty: "", description: "", unitPrice: "" }, index: null, filled: false });
  }
  return rows;
}
function checked(method) {
  return state.paymentMethod === method ? "checked" : "";
}
function renderApp() {
  app.innerHTML = `
    <div class="app-shell">
      <aside class="config-panel no-print">
        <div class="panel-header">
          <h1>NOTAS DE VENTA</h1>
          <p>Formato para ferreteria con captura rapida y vista previa inmediata.</p>
        </div>

        <section class="panel-section">
          <h2>Informacion de la empresa</h2>
          <label class="logo-uploader">
            <span>Logo de la empresa</span>
            <input id="logoInput" type="file" accept="image/*" />
            <div class="logo-box"><div id="companyLogoBox"></div></div>
          </label>
          <div class="button-row two-actions">
            <button id="removeLogo" class="btn secondary" type="button">Eliminar logo</button>
            <button id="saveCompany" class="btn primary" type="button">Guardar datos</button>
          </div>
          <div class="field-group">
            <label>Nombre de la empresa</label>
            <input id="businessName" value="${escapeHtml(company.businessName)}" />
          </div>
          <div class="field-group">
            <label>Subtitulo / giro</label>
            <input id="subtitle" value="${escapeHtml(company.subtitle)}" />
          </div>
          <div class="field-group">
            <label>RFC</label>
            <input id="rfc" value="${escapeHtml(company.rfc || "")}" />
          </div>
          <div class="field-group">
            <label>Direccion</label>
            <textarea id="address">${escapeHtml(company.address)}</textarea>
          </div>
          <div class="grid-two">
            <div class="field-group">
              <label>Telefono</label>
              <input id="phone" value="${escapeHtml(company.phone)}" />
            </div>
            <div class="field-group">
              <label>Email</label>
              <input id="email" value="${escapeHtml(company.email)}" />
            </div>
          </div>
          <div class="field-group">
            <label>Sitio web (opcional)</label>
            <input id="website" value="${escapeHtml(company.website)}" />
          </div>
        </section>

        <section class="panel-section">
          <h2>Configuracion de la nota</h2>
          <div class="grid-two compact-grid">
            <div class="field-group">
              <label>Folio</label>
              <input id="folio" value="${escapeHtml(state.folio)}" />
            </div>
            <div class="field-group">
              <label>Fecha</label>
              <input id="date" value="${escapeHtml(state.date)}" />
            </div>
          </div>
          <div class="grid-two compact-grid">
            <div class="field-group">
              <label>IVA</label>
              <select id="applyTax">
                <option value="true" ${state.applyTax ? "selected" : ""}>Aplicar 16%</option>
                <option value="false" ${!state.applyTax ? "selected" : ""}>No aplicar</option>
              </select>
            </div>
            <div class="field-group">
              <label>Anticipo</label>
              <input id="advance" type="number" min="0" step="0.01" value="${state.advance}" />
            </div>
          </div>
          <div class="field-group">
            <label>Descuento</label>
            <input id="discount" type="number" min="0" step="0.01" value="${state.discount}" />
          </div>
          <div class="field-group">
            <label>Pie de pagina / Mensaje</label>
            <textarea id="footerMessage">${escapeHtml(company.footerMessage)}</textarea>
          </div>
        </section>

        <section class="panel-section note-fields no-print">
          <h2>Datos del cliente</h2>
          <div class="grid-two compact-grid">
            <div class="field-group">
              <label>Nombre</label>
              <input id="customerName" value="${escapeHtml(state.customerName)}" />
            </div>
            <div class="field-group">
              <label>Entrega</label>
              <input id="deliveryDate" value="${escapeHtml(state.deliveryDate)}" />
            </div>
          </div>
          <div class="grid-three compact-grid">
            <div class="field-group">
              <label>Atendio</label>
              <input id="attendant" value="${escapeHtml(state.attendant)}" />
            </div>
            <div class="field-group">
              <label>Telefono</label>
              <input id="customerPhone" value="${escapeHtml(state.customerPhone)}" />
            </div>
            <div class="field-group">
              <label>RFC</label>
              <input id="customerRfc" value="${escapeHtml(state.customerRfc)}" />
            </div>
          </div>
          <div class="field-group">
            <label>Direccion</label>
            <input id="customerAddress" value="${escapeHtml(state.customerAddress)}" />
          </div>
          <div class="grid-three compact-grid">
            <div class="field-group">
              <label>Colonia</label>
              <input id="colony" value="${escapeHtml(state.colony)}" />
            </div>
            <div class="field-group">
              <label>Ciudad</label>
              <input id="city" value="${escapeHtml(state.city)}" />
            </div>
            <div class="field-group">
              <label>Email</label>
              <input id="customerEmail" value="${escapeHtml(state.customerEmail)}" />
            </div>
          </div>
        </section>
      </aside>

      <main class="workspace">
        <div class="toolbar no-print">
          <button id="addItem" class="btn secondary" type="button">Agregar fila</button>
          <button id="printNote" class="btn secondary" type="button">Imprimir</button>
          <button id="resetForm" class="btn ghost" type="button">Limpiar</button>
        </div>

        <section class="sheet print-area" id="printArea">
          <div class="sheet-header">
            <div class="sheet-brand" id="sheetBrand"></div>
            <div class="sheet-title">
              <h2>NOTA DE VENTA</h2>
              <p id="sheetSubtitle"></p>
              <p id="sheetBusinessName"></p>
              <div class="sheet-company-meta">
                <span id="sheetRfc"></span>
              </div>
            </div>
            <div class="sheet-meta">
              <div class="meta-line"><span>FOLIO:</span><strong id="sheetFolio"></strong></div>
              <div class="meta-line"><span>FECHA:</span><strong id="sheetDate"></strong></div>
            </div>
          </div>

          <div class="info-grid">
            ${displayField("Nombre", "sheetCustomerName")}
            ${displayField("Entrega", "sheetDeliveryDate")}
            ${displayField("Atendio", "sheetAttendant")}
            ${displayField("Telefono", "sheetCustomerPhone")}
            ${displayField("Direccion", "sheetCustomerAddress")}
            ${displayField("RFC", "sheetCustomerRfc")}
            ${displayField("Colonia", "sheetColony")}
            ${displayField("Ciudad", "sheetCity")}
            ${displayField("Email", "sheetCustomerEmail")}
          </div>

          <table class="note-table" id="itemsTable">
            <thead>
              <tr>
                <th class="qty-col">CANT.</th>
                <th>DESCRIPCION</th>
                <th class="price-col">P. UNIT</th>
                <th class="price-col">IMPORTE</th>
                <th class="action-col no-print">ACC.</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>

          <div class="sheet-bottom">
            <div class="sheet-legal">
              <p id="sheetFooterMessage"></p>

              <div class="payment-row">
                <label class="check-inline"><input type="checkbox" data-payment="Tarjeta" ${checked("Tarjeta")} /> Tarjeta</label>
                <label class="check-inline"><input type="checkbox" data-payment="Efectivo" ${checked("Efectivo")} /> Efectivo</label>
                <label class="check-inline"><input type="checkbox" data-payment="Transferencia" ${checked("Transferencia")} /> Transferencia</label>
              </div>

              <div class="amount-words">
                <span>CANTIDAD CON LETRA:</span>
                <strong id="amountInWords"></strong>
              </div>
            </div>

            <div class="totals-card">
              <div><span>SUBTOTAL:</span><strong id="subtotalValue"></strong></div>
              <div><span>I.V.A.:</span><strong id="taxValue"></strong></div>
              <div><span>ANTICIPO:</span><strong id="advanceValue"></strong></div>
              <div class="grand"><span>TOTAL:</span><strong id="totalValue"></strong></div>
            </div>
          </div>
        </section>
      </main>
    </div>
  `;
  bindStaticEvents();
  updatePreview();
  renderItemsTable();
}
function displayField(label, id) {
  return `
    <div class="line-field">
      <span>${label}:</span>
      <strong id="${id}" class="line-value"></strong>
    </div>
  `;
}
function getCompanyLogoMarkup() {
  if (company.logo) {
    return `<img src="${company.logo}" alt="Logo de la empresa" class="company-logo" />`;
  }
  return '<div class="company-logo placeholder">LOGO</div>';
}
function setText(id, value) {
  const el = document.querySelector(`#${id}`);
  if (el)
    el.textContent = value || "";
}
function setHtml(id, html) {
  const el = document.querySelector(`#${id}`);
  if (el)
    el.innerHTML = html;
}
function updatePreview() {
  setHtml("companyLogoBox", getCompanyLogoMarkup());
  setHtml("sheetBrand", getCompanyLogoMarkup());
  setText("sheetBusinessName", company.businessName || "CENFER FERRETERIA");
  setText("sheetRfc", company.rfc ? `RFC: ${company.rfc}` : "");
  setText("sheetAddress", company.address || "");
  const contact = [company.phone, company.email, company.website].filter(Boolean).join("  |  ");
  setText("sheetContact", contact);
  setText("sheetFolio", state.folio || "");
  setText("sheetDate", state.date || "");
  setText("sheetCustomerName", state.customerName || "");
  setText("sheetDeliveryDate", state.deliveryDate || "");
  setText("sheetAttendant", state.attendant || "");
  setText("sheetCustomerPhone", state.customerPhone || "");
  setText("sheetCustomerAddress", state.customerAddress || "");
  setText("sheetCustomerRfc", state.customerRfc || "");
  setText("sheetColony", state.colony || "");
  setText("sheetCity", state.city || "");
  setText("sheetCustomerEmail", state.customerEmail || "");
  setText("sheetFooterMessage", company.footerMessage || "");
  const subtotal = calcSubtotal();
  const tax = calcTax();
  const total = calcTotal();
  const amountInWords = total > 0 ? `${numberToSpanishWords(total)} pesos M.N.` : "";
  setText("subtotalValue", formatCurrency(subtotal));
  setText("taxValue", formatCurrency(tax));
  setText("advanceValue", formatCurrency(Number(state.advance || 0)));
  setText("totalValue", formatCurrency(total));
  setText("amountInWords", amountInWords);
  document.querySelectorAll("[data-payment]").forEach((checkbox) => {
    checkbox.checked = checkbox.dataset.payment === state.paymentMethod;
  });
}
function renderItemsTable() {
  const tbody = document.querySelector("#itemsTable tbody");
  if (!tbody)
    return;
  const activeElement = document.activeElement;
  const activeIndex = activeElement?.dataset?.index;
  const activeField = activeElement?.dataset?.field;
  const rows = lineRows();
  tbody.innerHTML = rows.map(({ item, index, filled }) => `
        <tr>
          <td>${filled ? `<input data-field="qty" data-index="${index}" type="number" min="1" step="1" value="${item.qty}" />` : ""}</td>
          <td>${filled ? `<input data-field="description" data-index="${index}" value="${escapeHtml(item.description)}" />` : ""}</td>
          <td>${filled ? `<input data-field="unitPrice" data-index="${index}" type="number" min="0" step="0.01" value="${item.unitPrice}" />` : ""}</td>
          <td class="amount-cell">${filled && item.description.trim() ? formatCurrency(calcAmount(item)) : ""}</td>
          <td class="no-print action-col">${filled ? `<button class="delete-row" data-remove="${index}" type="button">✕</button>` : ""}</td>
        </tr>
      `).join("");
  if (activeIndex !== undefined && activeField) {
    const inputToFocus = tbody.querySelector(`[data-index="${activeIndex}"][data-field="${activeField}"]`);
    if (inputToFocus) {
      inputToFocus.focus();
      const len = inputToFocus.value.length;
      if (inputToFocus.setSelectionRange) {
        inputToFocus.setSelectionRange(len, len);
      }
    }
  }
  tbody.querySelectorAll("[data-field]").forEach((input) => {
    input.addEventListener("input", handleItemInput);
  });
  tbody.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", handleRemoveRow);
  });
}
function bindStaticEvents() {
  document.querySelector("#saveCompany")?.addEventListener("click", handleSaveCompany);
  document.querySelector("#logoInput")?.addEventListener("change", handleLogoUpload);
  document.querySelector("#removeLogo")?.addEventListener("click", () => {
    company.logo = "";
    saveCompanyConfig(company);
    updatePreview();
  });
  document.querySelector("#addItem")?.addEventListener("click", () => {
    state.items.push({ qty: 1, description: "", unitPrice: 0 });
    renderItemsTable();
    updatePreview();
  });
  document.querySelector("#printNote")?.addEventListener("click", () => window.print());
  document.querySelector("#resetForm")?.addEventListener("click", () => {
    state = createInitialState();
    refillInputs();
    renderItemsTable();
    updatePreview();
  });
  document.querySelectorAll("#businessName, #subtitle, #rfc, #address, #phone, #email, #website, #footerMessage").forEach((input) => {
    input.addEventListener("input", handleCompanyInput);
  });
  document.querySelectorAll("#folio, #date, #customerName, #deliveryDate, #attendant, #customerPhone, #customerAddress, #customerRfc, #colony, #city, #customerEmail, #advance, #discount").forEach((input) => {
    input.addEventListener("input", handleStateInput);
  });
  document.querySelector("#applyTax")?.addEventListener("change", (event) => {
    state.applyTax = event.target.value === "true";
    updatePreview();
  });
  document.querySelectorAll("[data-payment]").forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {
      state.paymentMethod = event.currentTarget.dataset.payment;
      updatePreview();
    });
  });
}
function handleCompanyInput(event) {
  company[event.target.id] = event.target.value;
  updatePreview();
}
function handleStateInput(event) {
  const key = event.target.id;
  const numericFields = new Set(["discount", "advance"]);
  state[key] = numericFields.has(key) ? Number(event.target.value || 0) : event.target.value;
  updatePreview();
}
function handleItemInput(event) {
  const index = Number(event.target.dataset.index);
  const field = event.target.dataset.field;
  let value = event.target.value;
  if (field === "qty")
    value = Number(value || 0);
  if (field === "unitPrice")
    value = Number(value || 0);
  state.items[index][field] = value;
  const row = event.target.closest("tr");
  if (row) {
    const amountCell = row.querySelector(".amount-cell");
    if (amountCell && field !== "description") {
      const item = state.items[index];
      amountCell.textContent = item.description.trim() ? formatCurrency(calcAmount(item)) : "";
    }
  }
  updatePreview();
}
function handleRemoveRow(event) {
  const index = Number(event.currentTarget.dataset.remove);
  state.items.splice(index, 1);
  if (!state.items.length) {
    state.items.push({ qty: 1, description: "", unitPrice: 0 });
  }
  renderItemsTable();
  updatePreview();
}
function refillInputs() {
  const ids = [
    "folio",
    "date",
    "customerName",
    "deliveryDate",
    "attendant",
    "customerPhone",
    "customerAddress",
    "customerRfc",
    "colony",
    "city",
    "customerEmail",
    "advance",
    "discount"
  ];
  ids.forEach((id) => {
    const el = document.querySelector(`#${id}`);
    if (el)
      el.value = state[id] ?? "";
  });
  const applyTax = document.querySelector("#applyTax");
  if (applyTax)
    applyTax.value = String(state.applyTax);
}
function handleSaveCompany() {
  company = {
    ...company,
    businessName: document.querySelector("#businessName")?.value.trim(),
    subtitle: document.querySelector("#subtitle")?.value.trim(),
    rfc: document.querySelector("#rfc")?.value.trim(),
    address: document.querySelector("#address")?.value.trim(),
    phone: document.querySelector("#phone")?.value.trim(),
    email: document.querySelector("#email")?.value.trim(),
    website: document.querySelector("#website")?.value.trim(),
    footerMessage: document.querySelector("#footerMessage")?.value.trim()
  };
  saveCompanyConfig(company);
  updatePreview();
  alert("Informacion de la empresa guardada.");
}
function handleLogoUpload(event) {
  const file = event.target.files?.[0];
  if (!file)
    return;
  const reader = new FileReader;
  reader.onload = () => {
    company.logo = reader.result;
    saveCompanyConfig(company);
    updatePreview();
  };
  reader.readAsDataURL(file);
}
renderApp();
