const mesaApp = document.querySelector("[data-mesa-app]");

if (mesaApp) {
  const state = {
    tramites: [],
    faqs: [],
    user: null,
    dashboard: null,
    history: [],
    formularios: {},
    arcaActivities: [],
    instituciones: [],
    georef: null,
    georefProvincias: null,
    category: "Todos",
    homeCategory: "Todas",
    faqCategory: "Todas",
    activeFormId: "default",
    managementMode: "self",
    wizardStep: 0,
    locations: {},
    uploads: {},
    formValues: {},
    currentStatus: "En gestión",
    currentRequest: null,
    recents: ["reclamo-servicios", "nota-municipio"]
  };

  const defaultLocation = {
    lat: -28.367,
    lng: -65.7,
    zoom: 14,
    label: "Fray Mamerto Esquiú, Catamarca"
  };

  const mapInstances = new Map();

  const icons = {
    "file-plus": "M6 2h8l5 5v15H6V2Zm7 1.8V8h4.2L13 3.8ZM8.5 12h3v-3h2v3h3v2h-3v3h-2v-3h-3v-2Z",
    search: "M10.5 4a6.5 6.5 0 0 1 5.16 10.45l4.45 4.44-1.42 1.42-4.44-4.45A6.5 6.5 0 1 1 10.5 4Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z",
    upload: "M12 3 7 8h3v7h4V8h3l-5-5ZM5 18h14v2H5v-2Z",
    help: "M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm-1 14v2h2v-2h-2Zm1-10a3.2 3.2 0 0 0-3.3 3.1h2A1.25 1.25 0 0 1 12 8c.82 0 1.35.5 1.35 1.22 0 .62-.34.98-1.18 1.5-1.05.65-1.67 1.42-1.67 2.78V14h2v-.35c0-.68.28-1.02 1.1-1.55 1.05-.68 1.85-1.45 1.85-2.95C15.45 7.3 14.05 6 12 6Z",
    store: "M4 4h16l1 5v2h-1v9H4v-9H3V9l1-5Zm2 8v6h4v-6H6Zm6 0v6h6v-6h-6ZM5.65 6l-.4 3h13.5l-.4-3H5.65Z",
    "map-pin": "M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z",
    "file-text": "M6 2h9l5 5v15H6V2Zm8 2.8V8h3.2L14 4.8ZM8.5 12v2h9v-2h-9Zm0 4v2h6v-2h-6Z",
    home: "M4 11 12 4l8 7v9h-6v-6h-4v6H4v-9Z",
    "credit-card": "M3 5h18v14H3V5Zm2 3v2h14V8H5Zm0 5v3h5v-3H5Zm7 0v3h7v-3h-7Z",
    calendar: "M7 2h2v3h6V2h2v3h3v17H4V5h3V2Zm11 9H6v9h12v-9Z",
    inbox: "M4 4h16v12h-4a4 4 0 0 1-8 0H4V4Zm2 2v8h4v2a2 2 0 0 0 4 0v-2h4V6H6Z",
    "arrow-right": "m14 5 7 7-7 7-1.4-1.4 4.6-4.6H3v-2h14.2l-4.6-4.6L14 5Z",
    clock: "M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm1 5h-2v6l5 3 .95-1.64L13 12V7Z"
  };

  function icon(name) {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[name] || icons["file-text"]}"/></svg>`;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function getJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`No se pudo cargar ${path}`);
    return response.json();
  }

  function view(name) {
    document.querySelectorAll("[data-view]").forEach((section) => {
      section.hidden = section.dataset.view !== name && !(name === "home" && section.dataset.view === "home");
    });
    document.querySelectorAll(".mesa-actions").forEach((section) => {
      section.hidden = name !== "home";
    });
    if (name === "operador") {
      syncDerivationNoteUrl();
      syncDerivationOriginalRequest();
      const statusForm = document.querySelector("[data-status-form]");
      if (statusForm) updateStatusPreview(statusForm);
    }
    if (name === "perfil") renderProfile();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function hydrateInlineIcons() {
    document.querySelectorAll("[data-icon]").forEach((element) => {
      element.innerHTML = icon(element.dataset.icon);
    });
  }

  function renderCategories() {
    const holder = document.querySelector("[data-category-filters]");
    const categories = ["Todos", ...new Set(state.tramites.map((item) => item.categoria))];
    holder.innerHTML = categories.map((category) => (
      `<button type="button" class="${category === state.category ? "active" : ""}" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`
    )).join("");
  }

  function matchingTramites(query = "") {
    const normalized = query.toLowerCase().trim();
    const citizenKeywords = {
      "reclamo-servicios": ["luz", "luminaria", "calle", "poda", "arbol", "árbol", "residuos", "agua", "bache", "vereda"],
      "nota-municipio": ["nota", "presentar", "pedido", "solicitud"],
      "presentacion-general": ["reclamo", "consulta", "necesito", "quiero"],
      "rentas-consulta": ["deuda", "tasa", "pago", "rentas", "comprobante"],
      "habilitacion-comercial": ["comercio", "local", "habilitar", "emprendimiento"],
      "asistencia-instituciones": ["escuela", "institucion", "institución", "organismo", "alumnos", "docentes", "asistencia", "transporte", "desmalezado"],
      "obras-privadas": ["obra", "construccion", "construcción", "plano"],
      "solicitud-turno": ["turno", "atencion", "atención"]
    };

    return state.tramites.filter((tramite) => {
      const matchesCategory = state.homeCategory === "Todas" || tramite.categoria === state.homeCategory;
      const text = `${tramite.nombre} ${tramite.descripcion} ${tramite.categoria} ${tramite.documentacionRequerida?.join(" ")}`.toLowerCase();
      const keywordMatch = (citizenKeywords[tramite.id] || []).some((word) => normalized.includes(word));
      return matchesCategory && (!normalized || keywordMatch || text.includes(normalized) || normalized.split(/\s+/).some((word) => word.length > 3 && text.includes(word)));
    });
  }

  function renderHomeGuidance() {
    const categoriesHolder = document.querySelector("[data-home-categories]");
    const suggestionsHolder = document.querySelector("[data-home-suggestions]");
    const query = document.querySelector("[data-need-input]")?.value || "";
    const categories = ["Todas", ...new Set(state.tramites.map((item) => item.categoria))];
    categoriesHolder.innerHTML = categories.map((category) => (
      `<button type="button" class="${category === state.homeCategory ? "active" : ""}" data-home-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`
    )).join("");

    const suggestions = matchingTramites(query).slice(0, 4);
    suggestionsHolder.innerHTML = `
      <strong>Opciones sugeridas</strong>
      <div>
        ${suggestions.map((tramite) => `
          <button type="button" data-start-form="${escapeHtml(tramite.id)}">
            <span class="tramite-icon compact" style="background:${escapeHtml(tramite.color)}">${icon(tramite.icono)}</span>
            <span>
              <strong>${escapeHtml(tramite.nombre)}</strong>
              <small>${escapeHtml(tramite.descripcion)}</small>
            </span>
          </button>
        `).join("")}
        <button type="button" data-start-form="presentacion-general">
          <span class="tramite-icon compact">${icon("file-text")}</span>
          <span>
            <strong>Ninguna opción coincide con lo que necesito</strong>
            <small>Continuar con una Presentación general.</small>
          </span>
        </button>
      </div>
    `;
  }

  function renderCatalog() {
    const search = document.querySelector("[data-catalog-search]")?.value?.toLowerCase() || "";
    const list = document.querySelector("[data-tramite-list]");
    const filtered = state.tramites.filter((tramite) => {
      const matchesCategory = state.category === "Todos" || tramite.categoria === state.category;
      const text = `${tramite.nombre} ${tramite.descripcion} ${tramite.categoria}`.toLowerCase();
      return matchesCategory && text.includes(search);
    });

    list.innerHTML = filtered.map((tramite) => `
      <article class="tramite-card">
        <div class="tramite-icon" style="background:${escapeHtml(tramite.color)}">${icon(tramite.icono)}</div>
        <div>
          <span>${escapeHtml(tramite.categoria)} · ${escapeHtml(tramite.tiempoEstimado)}</span>
          <h3>${escapeHtml(tramite.nombre)}</h3>
          <p>${escapeHtml(tramite.descripcion)}</p>
        </div>
        <div class="tramite-meta">
          <span class="status-badge ${tramite.requiereAutenticacion ? "info" : "success"}">${tramite.requiereAutenticacion ? "Puede pedir validación" : "Sin login"}</span>
          <button class="button" type="button" data-start-form="${escapeHtml(tramite.id)}">Iniciar</button>
          <button class="favorite-button" type="button" aria-label="Agregar a favoritos" data-toast="Trámite guardado en favoritos">★</button>
        </div>
      </article>
    `).join("") || `<p class="empty-state">No encontramos trámites con esa búsqueda.</p>`;

  }

  function currentForm() {
    return state.formularios[state.activeFormId] || state.formularios.default;
  }

  function startWorkflow(formId) {
    state.activeFormId = formId || "presentacion-general";
    state.wizardStep = 0;
    state.formValues = {};
    state.uploads = {};
    state.currentRequest = null;
    state.currentStatus = "En gestión";
    if (!state.recents.includes(state.activeFormId)) state.recents.unshift(state.activeFormId);
    renderIdentification();
    renderWizard();
    view("identificacion");
  }

  function totalWorkflowSteps() {
    return currentForm().pasos.length + 2;
  }

  function renderIdentification() {
    const total = totalWorkflowSteps();
    document.querySelector("[data-identification-kicker]").textContent = `Paso 2 de ${total}`;
    document.querySelector("[data-identification-progress]").style.width = `${(2 / total) * 100}%`;
    if (state.activeFormId === "asistencia-instituciones") {
      renderInstitutionalIdentityPanel();
      renderInstitutionalIdentification();
      return;
    }

    renderDefaultIdentityPanel();
    document.querySelectorAll("[data-role-option]").forEach((button) => {
      button.classList.toggle("active", button.dataset.roleOption === state.managementMode);
    });

    const fields = document.querySelector("[data-identification-fields]");
    fields.innerHTML = `
      ${state.managementMode === "operator" ? renderOperatorContext() : ""}
      ${renderPersonFields("Titular", "titular", "Persona a cuyo nombre se realiza el trámite.")}
      ${state.managementMode !== "self" ? renderPersonFields("Presentante", "presentante", "Persona que completa o acompaña la gestión.") : ""}
      ${state.managementMode === "other" ? renderRepresentationFields() : ""}
      ${state.managementMode === "operator" ? renderMunicipalFields() : ""}
    `;
  }

  function renderDefaultIdentityPanel() {
    const panel = document.querySelector("[data-identification-mode-panel]");
    if (!panel) return;
    panel.innerHTML = `
      <h3>¿Para quién estás realizando esta gestión?</h3>
      <div class="role-options" role="radiogroup" aria-label="Para quién se realiza la gestión">
        <button class="${state.managementMode === "self" ? "active" : ""}" type="button" data-role-option="self">
          <strong>Para mí</strong>
          <span>Vos sos la persona titular de la solicitud.</span>
        </button>
        <button class="${state.managementMode === "other" ? "active" : ""}" type="button" data-role-option="other">
          <strong>Para otra persona</strong>
          <span>Estás realizando la gestión en representación de otra persona.</span>
        </button>
        <button class="${state.managementMode === "operator" ? "active" : ""}" type="button" data-role-option="operator">
          <strong>Estoy registrando la solicitud como agente municipal</strong>
          <span>Estás cargando la solicitud para un vecino atendido por otro canal.</span>
        </button>
      </div>
      <button class="catamarca-button" type="button" data-toast="Integración futura con Mi Catamarca preparada">
        <span>${icon("file-plus")}</span>
        Continuar con Mi Catamarca
      </button>
    `;
  }

  function renderInstitutionalIdentityPanel() {
    const panel = document.querySelector("[data-identification-mode-panel]");
    if (!panel) return;
    panel.innerHTML = `
      <h3>Solicitud institucional</h3>
      <div class="institution-mode-summary">
        <span>${icon("file-plus")}</span>
        <div>
          <strong>A nombre de una institución</strong>
          <p>La escuela u organismo se selecciona en el siguiente paso. Acá registramos a la persona de contacto que representa el pedido.</p>
        </div>
      </div>
      <button class="catamarca-button" type="button" data-toast="Integración futura con Mi Catamarca preparada">
        <span>${icon("file-plus")}</span>
        Continuar con Mi Catamarca
      </button>
    `;
  }

  function renderInstitutionalIdentification() {
    document.querySelectorAll("[data-role-option]").forEach((button) => {
      button.classList.remove("active");
    });

    const fields = document.querySelector("[data-identification-fields]");
    fields.innerHTML = `
      <div class="institution-identity-intro">
        <span class="status-badge info">Trámite institucional</span>
        <strong>La solicitud se realiza a nombre de una institución.</strong>
        <p>En el siguiente paso vas a seleccionar la escuela u organismo. Ahora necesitamos los datos de la persona que representa o acompaña el pedido para poder contactarla.</p>
      </div>
      <fieldset class="person-fieldset">
        <legend>Persona solicitante</legend>
        <p>Persona que está cargando el pedido en representación de la institución.</p>
        <div class="identity-fields">
          <label class="field"><span>Nombre y apellido</span><input type="text" name="solicitante-nombre"></label>
          <label class="field"><span>Cargo o vínculo con la institución</span><input type="text" name="solicitante-vinculo" placeholder="Directivo, docente, preceptor, referente, otro"></label>
          <label class="field"><span>Teléfono de contacto</span><input type="tel" name="solicitante-telefono" placeholder="383..."></label>
          <label class="field"><span>Correo electrónico</span><input type="email" name="solicitante-email"></label>
        </div>
      </fieldset>
      <fieldset class="person-fieldset">
        <legend>Representación</legend>
        <div class="identity-fields">
          <label class="upload-box wide"><input type="file" multiple><span>${icon("upload")}</span><strong>Adjuntar nota o documentación que respalde el pedido</strong><small>Opcional en el prototipo. El backend podrá definir cuándo es obligatorio.</small></label>
        </div>
      </fieldset>
      ${state.managementMode === "operator" ? renderOperatorContext() + renderMunicipalFields() : ""}
    `;
  }

  function renderPersonFields(title, prefix, help) {
    return `
      <fieldset class="person-fieldset">
        <legend>${escapeHtml(title)}</legend>
        <p>${escapeHtml(help)}</p>
        <div class="identity-fields">
          <label class="field"><span>Nombre y apellido</span><input type="text" name="${prefix}-nombre"></label>
          <label class="field"><span>DNI</span><input type="text" inputmode="numeric" name="${prefix}-dni"></label>
          <label class="field"><span>Teléfono</span><input type="tel" name="${prefix}-telefono"></label>
          <label class="field"><span>Correo electrónico</span><input type="email" name="${prefix}-email"></label>
          <label class="field wide"><span>Domicilio</span><input type="text" name="${prefix}-domicilio"></label>
        </div>
      </fieldset>
    `;
  }

  function renderRepresentationFields() {
    return `
      <fieldset class="person-fieldset">
        <legend>Representación</legend>
        <div class="identity-fields">
          <label class="field"><span>Vínculo con el titular</span><input type="text" placeholder="Familiar, gestor, apoderado"></label>
          <label class="field"><span>Motivo de la representación</span><input type="text" placeholder="Por ejemplo: la persona titular no puede asistir"></label>
          <label class="upload-box wide"><input type="file" multiple><span>${icon("upload")}</span><strong>Adjuntar documentación que acredite la representación</strong><small>Poder, autorización, nota firmada u otro respaldo.</small></label>
        </div>
      </fieldset>
    `;
  }

  function renderOperatorContext() {
    const operator = state.dashboard?.operadorActivo || { nombre: "María Gómez", area: "Centro de Atención Ciudadana" };
    return `
      <div class="operator-notice">
        <span class="status-badge info">Modo operador</span>
        <strong>Operador: ${escapeHtml(operator.nombre)} - ${escapeHtml(operator.area)}</strong>
      </div>
    `;
  }

  function renderMunicipalFields() {
    return `
      <fieldset class="person-fieldset operator-only">
        <legend>Registro municipal</legend>
        <div class="identity-fields">
          <label class="field"><span>Canal de ingreso</span><select>
            <option>Atención presencial</option>
            <option>WhatsApp</option>
            <option>Teléfono</option>
            <option>Correo electrónico</option>
            <option>Nota en papel</option>
            <option>Derivación interna</option>
            <option>Otro</option>
          </select></label>
          <label class="field wide"><span>Observaciones internas del operador</span><textarea rows="4" placeholder="No visible para el ciudadano"></textarea></label>
        </div>
      </fieldset>
    `;
  }

  function renderWizard() {
    const form = currentForm();
    const step = form.pasos[state.wizardStep];
    const total = totalWorkflowSteps();
    const current = state.wizardStep + 3;
    mapInstances.forEach((map) => map.remove());
    mapInstances.clear();
    document.querySelector("[data-wizard-title]").textContent = form.titulo;
    document.querySelector("[data-wizard-kicker]").textContent = `Paso ${current} de ${total}`;
    document.querySelector("[data-progress-bar]").style.width = `${(current / total) * 100}%`;
    document.querySelector("[data-wizard-prev]").disabled = state.wizardStep === 0;
    document.querySelector("[data-wizard-next]").textContent = state.wizardStep === form.pasos.length - 1 ? "Enviar solicitud" : "Continuar";
    document.querySelector("[data-wizard-step]").innerHTML = `
      <h3>${escapeHtml(step.titulo)}</h3>
      <div class="dynamic-fields">
        ${step.campos.map(renderField).join("")}
      </div>
    `;
    if (document.querySelector("[data-arca-activity-results]")) renderArcaActivityResults([], "");
    if (document.querySelector("[data-institution-results]")) renderInstitutionResults([], "");
    scheduleLocationPickerInit();
  }

  function renderField(field) {
    if (field.tipo === "domicilio-fme") {
      return renderStructuredAddress(field);
    }
    if (field.tipo === "actividad-arca") {
      return renderArcaActivityField(field);
    }
    if (field.tipo === "institucion") {
      return renderInstitutionField(field);
    }
    if (field.tipo === "textarea") {
      return `<label class="field"><span>${escapeHtml(field.label)}</span><textarea data-field-id="${escapeHtml(field.id || "")}" placeholder="${escapeHtml(field.placeholder || "")}" rows="6">${escapeHtml(state.formValues[field.id] || "")}</textarea></label>`;
    }
    if (field.tipo === "select") {
      return renderSelectField(field);
    }
    if (field.tipo === "radio") {
      return `<fieldset class="choice-field"><legend>${escapeHtml(field.label)}</legend>${(field.opciones || []).map((option) => `<label><input type="radio" name="${escapeHtml(field.id)}"> ${escapeHtml(option)}</label>`).join("")}</fieldset>`;
    }
    if (field.tipo === "checkbox-group") {
      return `<fieldset class="choice-field multi-choice"><legend>${escapeHtml(field.label)}</legend>${(field.opciones || []).map((option) => `<label><input type="checkbox" name="${escapeHtml(field.id)}[]" value="${escapeHtml(option)}"> ${escapeHtml(option)}</label>`).join("")}</fieldset>`;
    }
    if (field.tipo === "check") {
      return `<label class="check-field"><input type="checkbox"> <span>${escapeHtml(field.label)}</span></label>`;
    }
    if (["adjuntos", "dragdrop", "fotografia"].includes(field.tipo)) {
      return `<label class="upload-box"><input type="file" data-upload-field="${escapeHtml(field.id || "archivo")}" ${field.tipo !== "fotografia" ? "multiple" : "accept=\"image/*\""}><span>${icon("upload")}</span><strong>${escapeHtml(field.label)}</strong><small data-upload-status="${escapeHtml(field.id || "archivo")}">Seleccioná archivos desde tu dispositivo.</small></label>`;
    }
    if (field.tipo === "gps") {
      return renderLocationPicker(field);
    }
    if (field.tipo === "mapa") {
      return "";
    }
    const type = field.tipo === "telefono" ? "tel" : field.tipo === "fecha" ? "date" : field.tipo === "texto" ? "text" : field.tipo;
    return `<label class="field"><span>${escapeHtml(field.label)}</span><input type="${escapeHtml(type)}" data-field-id="${escapeHtml(field.id || "")}" placeholder="${escapeHtml(field.placeholder || "")}" value="${escapeHtml(state.formValues[field.id] || "")}"></label>`;
  }

  function renderSelectField(field, extraClass = "") {
    const placeholder = field.placeholder || "Seleccioná una opción";
    const options = field.opciones || [];
    const attrs = field.attrs || "";
    const disabled = field.disabled ? " disabled" : "";
    return `
      <label class="field ${extraClass}">
        <span>${escapeHtml(field.label)}</span>
        <select name="${escapeHtml(field.id || "")}" data-field-id="${escapeHtml(field.id || "")}"${disabled}${attrs ? ` ${attrs}` : ""}>
          <option value="" selected disabled>${escapeHtml(placeholder)}</option>
          ${options.map((option) => renderSelectOption(option)).join("")}
        </select>
        ${field.ayuda ? `<small class="field-help">${escapeHtml(field.ayuda)}</small>` : ""}
      </label>
    `;
  }

  function renderSelectOption(option) {
    if (typeof option === "string") return `<option>${escapeHtml(option)}</option>`;
    const value = option.codigo || option.value || option.label || option.descripcion || "";
    const label = option.label || [option.codigo, option.descripcion].filter(Boolean).join(" - ");
    const titleText = option.title || (option.descripcionLarga && option.descripcionLarga !== option.descripcion ? option.descripcionLarga : "");
    const title = titleText ? ` title="${escapeHtml(titleText)}"` : "";
    return `<option value="${escapeHtml(value)}"${title}>${escapeHtml(label)}</option>`;
  }

  function renderArcaActivityField(field) {
    const options = field.fuenteDatos ? state.arcaActivities : field.opciones || [];
    return `
      <section class="arca-activity-field">
        <label class="field">
          <span>Buscar actividad</span>
          <input type="search" data-arca-activity-search placeholder="Escribí código, rubro o palabra clave">
        </label>
        <input type="hidden" name="${escapeHtml(field.id || "actividad-arca")}" data-arca-activity-value>
        <div class="arca-results" data-arca-activity-results aria-live="polite"></div>
        <div class="selected-activity" data-selected-arca-activity hidden></div>
        <div class="source-note">
          <strong>Nomenclador ARCA</strong>
          <p>El código debe coincidir con la actividad declarada o a declarar ante ARCA. El buscador usa el listado completo del archivo F.883 cargado en el sistema.</p>
          <a href="${escapeHtml(field.fuente || "https://serviciosweb.afip.gob.ar/genericos/nomencladoractividades/index.aspx")}" target="_blank" rel="noopener">Abrir buscador oficial</a>
        </div>
      </section>
    `;
  }

  function renderInstitutionField(field) {
    return `
      <section class="institution-field">
        <label class="field">
          <span>${escapeHtml(field.label || "Buscar institución")}</span>
          <input type="search" data-institution-search placeholder="${escapeHtml(field.placeholder || "Escribí el nombre de la escuela u organismo")}">
        </label>
        <input type="hidden" name="${escapeHtml(field.id || "institucion")}" data-field-id="${escapeHtml(field.id || "institucion")}" data-institution-value>
        <div class="institution-results" data-institution-results aria-live="polite"></div>
        <div class="selected-institution" data-selected-institution hidden></div>
        <div class="source-note">
          <strong>Listado oficial de instituciones</strong>
          <p>La búsqueda usa el nombre de escuela u organismo de la columna B de la hoja Instituciones.</p>
        </div>
      </section>
    `;
  }

  function renderStructuredAddress(field) {
    const georef = state.georef || {};
    const isContributorAddress = field.id === "domicilio-real";
    const provincias = isContributorAddress
      ? (state.georefProvincias?.provincias || []).map((item) => georefOption(item))
      : georef.provincia ? [georefOption(georef.provincia)] : ["Catamarca"];
    const departamentos = isContributorAddress
      ? []
      : georef.departamento ? [georefOption(georef.departamento)] : ["Fray Mamerto Esquiú"];
    const localidades = !isContributorAddress && georef.localidades?.length
      ? uniqueLocalitiesByDisplayName(georef.localidades).map((item) => georefOption(item))
      : [];
    return `
      <fieldset class="structured-address">
        <legend>${escapeHtml(field.label || "Domicilio")}</legend>
        <div class="address-grid">
          ${renderSelectField({ id: `${field.id}-provincia`, label: "Provincia", opciones: provincias, placeholder: "Seleccioná provincia", attrs: isContributorAddress ? `data-georef-province data-address-prefix="${escapeHtml(field.id)}"` : "" })}
          ${renderSelectField({ id: `${field.id}-departamento`, label: "Departamento", opciones: departamentos, placeholder: isContributorAddress ? "Primero seleccioná provincia" : "Seleccioná departamento", disabled: isContributorAddress, attrs: isContributorAddress ? `data-georef-department data-address-prefix="${escapeHtml(field.id)}"` : "" })}
          ${renderSelectField({ id: `${field.id}-localidad`, label: "Localidad", opciones: localidades, placeholder: isContributorAddress ? "Primero seleccioná departamento" : "Seleccioná localidad", disabled: isContributorAddress, attrs: isContributorAddress ? `data-georef-locality data-address-prefix="${escapeHtml(field.id)}"` : "" })}
          <label class="field"><span>Calle</span><input type="text" name="${escapeHtml(field.id)}-calle" placeholder="Nombre de la calle"></label>
          <label class="field"><span>Número de casa/local</span><input type="text" inputmode="numeric" name="${escapeHtml(field.id)}-numero" placeholder="Ej: 125"></label>
          <label class="field"><span>Barrio</span><input type="text" name="${escapeHtml(field.id)}-barrio" placeholder="Barrio o loteo"></label>
        </div>
      </fieldset>
    `;
  }

  function georefOption(item, includeCategory = false) {
    const category = includeCategory && item.categoria ? ` - ${item.categoria}` : "";
    return {
      value: item.id,
      label: `${displayLocalityName(item)}${category}`,
      title: [item.nombre, item.categoria, item.id].filter(Boolean).join(" - ")
    };
  }

  function displayLocalityName(item) {
    return item.nombre === "San José" && item.departamento?.id === "10063" ? "San José de Piedra Blanca" : item.nombre;
  }

  function uniqueLocalitiesByDisplayName(items) {
    return [...new Map(items.map((item) => [displayLocalityName(item), item])).values()];
  }

  function renderLocationPicker(field) {
    const pickerId = `location-${escapeHtml(field.id || "ubicacion")}`;
    const current = state.locations[field.id] || defaultLocation;
    return `
      <section class="location-picker" data-location-picker="${pickerId}" data-location-field="${escapeHtml(field.id || "ubicacion")}">
        <div class="location-head">
          <div>
            <strong>${escapeHtml(field.label)}</strong>
            <p>Buscá una dirección, tocá el mapa o mové el marcador. El mapa inicia en ${escapeHtml(defaultLocation.label)}.</p>
          </div>
          <button class="outline-button" type="button" data-use-current-location>Usar mi ubicación actual</button>
        </div>
        <div class="real-map" id="${pickerId}" role="application" aria-label="Selector de ubicación" tabindex="0"></div>
        <p class="map-help">Acercá o alejate con los botones + y -, pellizcando la pantalla o con doble toque.</p>
        <div class="location-fields">
          <input type="hidden" data-location-lat value="${current.lat.toFixed(6)}">
          <input type="hidden" data-location-lng value="${current.lng.toFixed(6)}">
          <label class="field wide"><span>Dirección o referencia</span><input type="text" data-location-reference placeholder="Ej: frente a la plaza, esquina, barrio" value="${escapeHtml(current.reference || "")}"></label>
        </div>
        <p class="location-status" data-location-status>Ubicación inicial: ${escapeHtml(defaultLocation.label)}.</p>
      </section>
    `;
  }

  function initLocationPickers() {
    document.querySelectorAll("[data-location-picker]").forEach((picker) => {
      const fieldId = picker.dataset.locationField;
      const mapElement = picker.querySelector(".real-map");
      if (!fieldId || !mapElement || mapInstances.has(mapElement.id)) return;

      if (!window.L) {
        picker.querySelector("[data-location-status]").textContent = "No se pudo cargar el mapa. Revisá la conexión e intentá nuevamente.";
        return;
      }

      const stored = state.locations[fieldId] || defaultLocation;
      const map = L.map(mapElement.id, {
        zoomControl: true,
        touchZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        scrollWheelZoom: "center",
        invalidateSize: true
      }).setView([stored.lat, stored.lng], stored.zoom || defaultLocation.zoom);

      map.scrollWheelZoom.disable();
      mapElement.addEventListener("focus", () => map.scrollWheelZoom.enable());
      mapElement.addEventListener("blur", () => map.scrollWheelZoom.disable());
      mapElement.addEventListener("wheel", (event) => {
        if (event.ctrlKey) map.scrollWheelZoom.enable();
      }, { passive: true });
      mapElement.addEventListener("mouseleave", () => map.scrollWheelZoom.disable());

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap"
      }).addTo(map);

      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
      });

      const marker = L.marker([stored.lat, stored.lng], {
        draggable: true,
        title: "Ubicación seleccionada"
      }).addTo(map);

      if (L.Control?.geocoder) {
        L.Control.geocoder({
          defaultMarkGeocode: false,
          placeholder: "Buscar dirección o lugar",
          errorMessage: "No encontramos esa ubicación",
          geocoder: L.Control.Geocoder.nominatim({
            geocodingQueryParams: {
              countrycodes: "ar",
              viewbox: "-65.86,-28.25,-65.55,-28.52",
              bounded: 0
            }
          })
        })
          .on("markgeocode", (event) => {
            const center = event.geocode.center;
            marker.setLatLng(center);
            map.setView(center, 17);
            const label = event.geocode.name || "Ubicación encontrada";
            picker.querySelector("[data-location-reference]").value = label;
            update(center, "Ubicación encontrada.");
          })
          .addTo(map);
      }

      const update = (latlng, message = "Ubicación seleccionada.") => {
        const lat = Number(latlng.lat);
        const lng = Number(latlng.lng);
        const reference = picker.querySelector("[data-location-reference]")?.value || "";
        state.locations[fieldId] = { lat, lng, zoom: map.getZoom(), reference };
        picker.querySelector("[data-location-lat]").value = lat.toFixed(6);
        picker.querySelector("[data-location-lng]").value = lng.toFixed(6);
        picker.querySelector("[data-location-status]").textContent = `${message} Podés continuar o ajustar el punto.`;
      };

      marker.on("dragend", () => update(marker.getLatLng(), "Marcador actualizado."));
      map.on("click", (event) => {
        marker.setLatLng(event.latlng);
        update(event.latlng, "Punto elegido en el mapa.");
      });

      picker.querySelector("[data-location-reference]")?.addEventListener("input", (event) => {
        state.locations[fieldId] = {
          ...(state.locations[fieldId] || stored),
          reference: event.target.value
        };
      });

      picker.querySelector("[data-use-current-location]")?.addEventListener("click", () => {
        useBrowserLocation(picker, map, marker, update);
      });

      mapInstances.set(mapElement.id, map);
      refreshMapLayout(map);
    });
  }

  function scheduleLocationPickerInit() {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        initLocationPickers();
      });
    });
  }

  function refreshMapLayout(map) {
    [0, 120, 350, 700, 1200].forEach((delay) => {
      window.setTimeout(() => {
        map.invalidateSize({ animate: false, pan: false });
        map.setView(map.getCenter(), map.getZoom(), { animate: false });
      }, delay);
    });
  }

  function useBrowserLocation(picker, map, marker, update) {
    const status = picker.querySelector("[data-location-status]");
    if (!navigator.geolocation) {
      status.textContent = "Este navegador no permite obtener la ubicación actual.";
      return;
    }

    status.textContent = "Solicitando permiso de ubicación...";
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latlng = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        marker.setLatLng(latlng);
        map.setView(latlng, 17);
        update(latlng, "Ubicación actual detectada.");
      },
      () => {
        status.textContent = `No pudimos acceder a tu ubicación. El mapa queda centrado en ${defaultLocation.label}.`;
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  function renderHistory(selector = "[data-history-list]") {
    const holder = document.querySelector(selector);
    holder.innerHTML = state.history.map((item) => `
      <article class="timeline-item" style="--state-color:${escapeHtml(item.color)}">
        <span>${icon(item.icono)}</span>
        <div>
          <strong>${escapeHtml(item.estado)}</strong>
          <time>${escapeHtml(item.fecha)}</time>
          <p>${escapeHtml(item.comentarios)}</p>
        </div>
      </article>
    `).join("");
  }

  function renderFaq() {
    const search = document.querySelector("[data-faq-search]")?.value?.toLowerCase() || "";
    const categories = ["Todas", ...new Set(state.faqs.map((item) => item.categoria))];
    document.querySelector("[data-faq-categories]").innerHTML = categories.map((category) => (
      `<button type="button" class="${category === state.faqCategory ? "active" : ""}" data-faq-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`
    )).join("");
    const faqs = state.faqs.filter((item) => {
      const matchesCategory = state.faqCategory === "Todas" || item.categoria === state.faqCategory;
      return matchesCategory && `${item.pregunta} ${item.respuesta}`.toLowerCase().includes(search);
    });
    document.querySelector("[data-faq-list]").innerHTML = faqs.map((item) => `
      <details>
        <summary>${escapeHtml(item.pregunta)}</summary>
        <p>${escapeHtml(item.respuesta)}</p>
      </details>
    `).join("");
  }

  function renderProfile() {
    if (!state.user) return;
    document.querySelector("[data-user-avatar]").textContent = state.user.avatar;
    document.querySelector("[data-user-name]").textContent = state.user.nombre;
    const activeRequests = state.currentRequest ? [state.currentRequest] : [];
    const favoriteForms = state.user.favoritos.map((id) => state.tramites.find((item) => item.id === id)).filter(Boolean);
    const notifications = state.currentRequest
      ? [`Tu solicitud ${state.currentRequest.numero} fue recibida por Mesa de Entrada.`, ...state.user.notificaciones]
      : state.user.notificaciones;
    document.querySelector("[data-user-profile]").innerHTML = `
      <article class="profile-card profile-data-card">
        <h3>Datos de contacto</h3>
        <form class="profile-form" data-profile-form>
          <label class="field"><span>Nombre y apellido</span><input name="nombre" type="text" value="${escapeHtml(state.user.nombre || "")}"></label>
          <label class="field"><span>DNI</span><input name="dni" type="text" inputmode="numeric" value="${escapeHtml(state.user.dni || "")}"></label>
          <label class="field"><span>Teléfono</span><input name="telefono" type="tel" value="${escapeHtml(state.user.telefono || "")}"></label>
          <label class="field"><span>Correo electrónico</span><input name="email" type="email" value="${escapeHtml(state.user.email || "")}"></label>
          <label class="field wide"><span>Domicilio</span><input name="domicilio" type="text" value="${escapeHtml(state.user.domicilio || "")}"></label>
          <button class="button" type="submit">Guardar datos</button>
        </form>
      </article>
      <article class="profile-card profile-requests-card">
        <div class="profile-card-head">
          <h3>Mis solicitudes</h3>
          <button class="outline-button" type="button" data-go="catalogo">Nueva solicitud</button>
        </div>
        <div class="profile-request-list">
          ${activeRequests.map((request) => `
            <section class="profile-request">
              <div>
                <span class="status-badge info">${escapeHtml(request.estado)}</span>
                <strong>${escapeHtml(request.numero)}</strong>
                <p>${escapeHtml(request.tema)}</p>
                <small>${escapeHtml(request.institucion || request.vecino)}${request.fechaIngreso ? ` · Ingresó ${escapeHtml(request.fechaIngreso)}` : ""}</small>
              </div>
              <div class="profile-actions">
                <button class="outline-button" type="button" data-profile-action="seguimiento">Ver seguimiento</button>
                <button class="outline-button" type="button" data-profile-action="adjuntar">Adjuntar documentación</button>
              </div>
            </section>
          `).join("") || `
            <p class="empty-state compact">Todavía no cargaste solicitudes en esta sesión.</p>
          `}
        </div>
      </article>
      <article class="profile-card">
        <h3>Trámites favoritos</h3>
        <div class="profile-shortcuts">
          ${favoriteForms.map((tramite) => `
            <button type="button" data-start-form="${escapeHtml(tramite.id)}">
              <span class="tramite-icon compact" style="background:${escapeHtml(tramite.color)}">${icon(tramite.icono)}</span>
              <strong>${escapeHtml(tramite.nombre)}</strong>
            </button>
          `).join("") || `<p class="empty-state compact">No hay favoritos guardados.</p>`}
        </div>
      </article>
      <article class="profile-card">
        <h3>Notificaciones</h3>
        <ul>${notifications.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </article>
      <article class="profile-card">
        <h3>Borradores</h3>
        <ul>
          ${state.user.borradores.map((item) => `
            <li>
              <span>${escapeHtml(item)}</span>
              <button class="outline-button" type="button" data-start-form="presentacion-general">Continuar</button>
            </li>
          `).join("")}
        </ul>
      </article>
      <article class="profile-card">
        <h3>Historial</h3>
        <ul>${state.user.historial.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </article>
    `;
  }

  function currentTramite() {
    return state.tramites.find((item) => item.id === state.activeFormId) || {
      id: state.activeFormId,
      nombre: currentForm().titulo
    };
  }

  function requestSummary() {
    return state.formValues.solicitud || state.formValues.detalle || state.formValues.necesidad || state.formValues.observaciones || "Solicitud enviada desde la Mesa Virtual.";
  }

  function requestApplicant() {
    if (state.activeFormId === "asistencia-instituciones") {
      return state.formValues.institucionNombre || "Institución sin seleccionar";
    }
    return state.formValues["titular-nombre"] || state.formValues["solicitante-nombre"] || state.formValues.nombre || "Solicitante sin identificar";
  }

  function captureIdentificationValues() {
    const form = document.querySelector("[data-identification-form]");
    if (!form) return;
    new FormData(form).forEach((value, key) => {
      if (typeof value === "string") state.formValues[key] = value;
    });
  }

  function createSubmittedRequest() {
    captureIdentificationValues();
    const tramite = currentTramite();
    state.currentStatus = "Recibido";
    state.currentRequest = {
      numero: "FME-2026-000001",
      vecino: requestApplicant(),
      tema: tramite.nombre || currentForm().titulo,
      estado: state.currentStatus,
      prioridad: "Normal",
      resumen: requestSummary(),
      institucion: state.formValues.institucionNombre || "",
      contacto: state.formValues["solicitante-nombre"] || state.formValues.nombre || state.formValues["titular-nombre"] || "",
      telefono: state.formValues["solicitante-telefono"] || state.formValues.telefono || state.formValues["titular-telefono"] || "",
      notaUrl: state.uploads.nota?.absoluteUrl || "",
      fechaIngreso: new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date())
    };
    if (!state.user.tramites.includes(state.currentRequest.numero)) {
      state.user.tramites.unshift(state.currentRequest.numero);
    }
    state.history = [{
      estado: "Recibido",
      fecha: state.currentRequest.fechaIngreso,
      comentarios: state.currentRequest.resumen,
      icono: "inbox",
      color: "#3b82f6"
    }];
  }

  function renderOperatorDetail() {
    const request = state.currentRequest;
    const number = document.querySelector("[data-detail-number]");
    const summary = document.querySelector("[data-detail-summary]");
    if (!request) {
      updateCurrentStatus("Sin solicitud");
      if (number) number.textContent = "Sin solicitud seleccionada";
      if (summary) summary.textContent = "Cuando cargues una solicitud, se va a mostrar acá para que el operador la gestione.";
      syncDerivationOriginalRequest();
      return;
    }
    updateCurrentStatus(request.estado);
    if (number) number.textContent = request.numero;
    if (summary) {
      summary.textContent = [
        request.institucion || request.vecino,
        request.tema,
        request.telefono ? `Contacto: ${request.telefono}` : ""
      ].filter(Boolean).join(" · ");
    }
    syncDerivationOriginalRequest();
    syncDerivationNoteUrl();
  }

  function renderDashboard() {
    if (!state.dashboard) return;
    const metricas = state.currentRequest
      ? { total: 1, nuevos: state.currentRequest.estado === "Recibido" ? 1 : 0, enGestion: state.currentRequest.estado === "En gestión" ? 1 : 0, vencidos: 0 }
      : { total: 0, nuevos: 0, enGestion: 0, vencidos: 0 };
    const metricLabels = [["Total", "total"], ["Nuevos", "nuevos"], ["En gestión", "enGestion"], ["Vencidos", "vencidos"]];
    document.querySelector("[data-dashboard-metrics]").innerHTML = metricLabels.map(([label, key]) => `
      <article><span>${label}</span><strong>${metricas[key]}</strong></article>
    `).join("");
    const max = Math.max(...state.dashboard.semanal);
    document.querySelector("[data-weekly-chart]").innerHTML = state.dashboard.semanal.map((value) => (
      `<span style="height:${Math.max(18, (value / max) * 100)}%" title="${value} trámites"></span>`
    )).join("");
    const tramites = state.currentRequest ? [state.currentRequest] : [];
    document.querySelector("[data-dashboard-table]").innerHTML = tramites.map((item) => `
      <article>
        <strong>${escapeHtml(item.numero)}</strong>
        <span>${escapeHtml(item.vecino)}</span>
        <p>${escapeHtml(item.tema)}</p>
        <em>${escapeHtml(item.estado)}</em>
      </article>
    `).join("") || `<p class="empty-state compact">Todavía no hay solicitudes cargadas en esta sesión.</p>`;
    renderOperatorDetail();
    renderHistory("[data-dashboard-timeline]");
  }

  function toast(message) {
    const box = document.querySelector("[data-toast-box]");
    box.textContent = message;
    box.hidden = false;
    window.clearTimeout(toast.timeout);
    toast.timeout = window.setTimeout(() => {
      box.hidden = true;
    }, 2600);
  }

  function formatDate(value) {
    if (!value) return "";
    const [year, month, day] = String(value).split("-");
    if (!year || !month || !day) return value;
    return `${day}/${month}/${year}`;
  }

  function statusMessage(data) {
    return [
      "Actualización de Mesa de Entrada: FME-2026-000001",
      `Estado: ${data.estado || "Sin estado"}`,
      `Comentario: ${data.comentarioVisible || "Sin comentario visible"}`
    ].join("\n");
  }

  function updateStatusPreview(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    const preview = form.querySelector("[data-status-preview]");
    if (!preview) return;
    preview.textContent = statusMessage(data);
  }

  function statusColor(status) {
    const colors = {
      "Recibido": "#3b82f6",
      "En revisión": "#f59e0b",
      "Derivado": "#8b5cf6",
      "En gestión": "#0ea5e9",
      "Pendiente de documentación": "#ef4444",
      "Resuelto": "#16a34a",
      "Cerrado": "#64748b"
    };
    return colors[status] || "#0ea5e9";
  }

  function updateCurrentStatus(status) {
    state.currentStatus = status;
    const badge = document.querySelector("[data-current-status]");
    if (!badge) return;
    badge.textContent = status;
    badge.classList.toggle("success", status === "Resuelto" || status === "Cerrado");
    badge.classList.toggle("info", status !== "Resuelto" && status !== "Cerrado");
  }

  function addStatusHistory(data) {
    const now = new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date());
    state.history = [
      {
        estado: data.estado,
        fecha: now,
        comentarios: data.comentarioVisible,
        icono: data.estado === "Resuelto" || data.estado === "Cerrado" ? "file-text" : "clock",
        color: statusColor(data.estado)
      },
      ...state.history
    ];
    renderHistory("[data-dashboard-timeline]");
  }

  async function sendStatusNotification(data) {
    const response = await fetch("/api/operator/notify-status-whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tracking: "FME-2026-000001",
        estado: data.estado,
        comentarioVisible: data.comentarioVisible,
        number: data.number
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || "No se pudo enviar la notificación de estado.");
    }
    return result;
  }

  function derivationMessage(data) {
    const lines = [
      "Nueva derivación de Mesa de Entrada: FME-2026-000001",
      `Área destinataria: ${data.area || "Sin área seleccionada"}`,
    ];
    if (data.fechaEvento) {
      lines.push(`Fecha del evento o necesidad: ${formatDate(data.fechaEvento)}`);
    }
    if (data.includeSolicitud && data.solicitudOriginal) {
      lines.push(`Solicitud original: ${data.solicitudOriginal}`);
    }
    lines.push(
      `Nota interna del operador: ${data.observacion || "Sin nota interna"}`,
      `Nota original: ${data.notaUrl || "Sin enlace"}`
    );
    return lines.join("\n");
  }

  function updateDerivationPreview(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    data.fechaEvento = document.querySelector("[data-event-date]")?.value || "";
    const preview = form.querySelector("[data-derivation-preview]");
    if (!preview) return;
    preview.textContent = derivationMessage(data);
  }

  function syncDerivationNoteUrl() {
    const note = state.uploads.nota;
    const input = document.querySelector('[data-derivation-form] input[name="notaUrl"]');
    if (note?.absoluteUrl && input) {
      input.value = note.absoluteUrl;
      updateDerivationPreview(input.closest("[data-derivation-form]"));
    } else if (input && state.currentRequest?.notaUrl) {
      input.value = state.currentRequest.notaUrl;
      updateDerivationPreview(input.closest("[data-derivation-form]"));
    }
  }

  function syncDerivationOriginalRequest() {
    const field = document.querySelector("[data-original-request]");
    if (field) field.value = state.currentRequest?.resumen || state.formValues.solicitud || "La solicitud original aparecerá acá cuando la institución la cargue.";
    const form = field?.closest("[data-derivation-form]");
    if (form) updateDerivationPreview(form);
  }

  async function uploadNoteFile(input) {
    const file = input.files?.[0];
    if (!file) return;

    const field = input.dataset.uploadField;
    const status = document.querySelector(`[data-upload-status="${CSS.escape(field)}"]`);
    if (field !== "nota") {
      if (status) status.textContent = `${input.files.length} archivo(s) seleccionado(s).`;
      return;
    }

    if (status) status.textContent = "Subiendo nota...";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("tracking", "FME-2026-000001");

    const response = await fetch("/api/uploads/note", {
      method: "POST",
      body: formData
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || "No se pudo subir la nota.");
    }

    state.uploads.nota = result;
    if (status) status.textContent = `Nota cargada: ${result.filename}`;
    syncDerivationNoteUrl();
    toast("Nota cargada. El operador podrá enviarla en la derivación.");
  }

  async function sendDerivationNotification(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    const payload = {
      tracking: "FME-2026-000001",
      area: data.area,
      fechaEvento: document.querySelector("[data-event-date]")?.value || "",
      observacion: data.observacion,
      includeSolicitud: Boolean(data.includeSolicitud),
      solicitudOriginal: data.solicitudOriginal,
      notaUrl: data.notaUrl,
      number: data.number
    };

    const response = await fetch("/api/operator/notify-whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || "No se pudo enviar la notificación.");
    }

    return result;
  }

  async function loadGeorefDepartments(provinceId) {
    const response = await fetch(`https://apis.datos.gob.ar/georef/api/departamentos?provincia=${encodeURIComponent(provinceId)}&campos=id,nombre,provincia&max=250`);
    if (!response.ok) throw new Error("No se pudieron cargar departamentos");
    const data = await response.json();
    return (data.departamentos || []).sort((a, b) => a.nombre.localeCompare(b.nombre, "es")).map((item) => georefOption(item));
  }

  async function loadGeorefLocalities(provinceId, departmentId) {
    const response = await fetch(`https://apis.datos.gob.ar/georef/api/localidades?provincia=${encodeURIComponent(provinceId)}&departamento=${encodeURIComponent(departmentId)}&campos=id,nombre,categoria,localidad_censal,departamento,municipio,provincia&max=1000`);
    if (!response.ok) throw new Error("No se pudieron cargar localidades");
    const data = await response.json();
    const localidades = uniqueLocalitiesByDisplayName(data.localidades || [])
      .sort((a, b) => displayLocalityName(a).localeCompare(displayLocalityName(b), "es") || a.id.localeCompare(b.id));
    return localidades.map((item) => georefOption(item));
  }

  function setSelectOptions(select, options, placeholder) {
    if (!select) return;
    select.innerHTML = `
      <option value="" selected disabled>${escapeHtml(placeholder)}</option>
      ${options.map((option) => renderSelectOption(option)).join("")}
    `;
    select.disabled = false;
  }

  function resetSelect(select, placeholder) {
    if (!select) return;
    select.innerHTML = `<option value="" selected disabled>${escapeHtml(placeholder)}</option>`;
    select.disabled = true;
  }

  function filterArcaActivityOptions(query) {
    const results = document.querySelector("[data-arca-activity-results]");
    if (!results) return;
    const normalized = normalizeText(query);
    const options = state.arcaActivities.filter((activity) => {
      if (!normalized) return false;
      return normalizeText(`${activity.codigo} ${activity.descripcion} ${activity.descripcionLarga}`).includes(normalized);
    }).slice(0, 12);
    renderArcaActivityResults(options, normalized);
  }

  function renderArcaActivityResults(options, hasQuery) {
    const results = document.querySelector("[data-arca-activity-results]");
    if (!results) return;
    if (!hasQuery) {
      results.innerHTML = `<p class="empty-state compact">Buscá por código o palabra clave para ver actividades.</p>`;
      return;
    }
    if (!options.length) {
      results.innerHTML = `<p class="empty-state compact">No encontramos actividades con esa búsqueda.</p>`;
      return;
    }
    results.innerHTML = `
      <span>${options.length} resultados principales</span>
      <div>
        ${options.map((activity) => `
          <article>
            <button type="button" data-select-arca-activity="${escapeHtml(activity.codigo)}">
              <strong>${escapeHtml(activity.codigo)} - ${escapeHtml(activity.descripcion)}</strong>
              <small>${escapeHtml(activity.descripcionLarga || activity.descripcion)}</small>
            </button>
          </article>
        `).join("")}
      </div>
    `;
  }

  function selectArcaActivity(code) {
    const activity = state.arcaActivities.find((item) => item.codigo === code);
    if (!activity) return;
    const value = document.querySelector("[data-arca-activity-value]");
    const selected = document.querySelector("[data-selected-arca-activity]");
    if (value) value.value = activity.codigo;
    if (selected) {
      selected.hidden = false;
      selected.innerHTML = `
        <span>Actividad seleccionada</span>
        <strong>${escapeHtml(activity.codigo)} - ${escapeHtml(activity.descripcion)}</strong>
        <button class="outline-button" type="button" data-clear-arca-activity>Cambiar</button>
      `;
    }
  }

  function filterInstitutionOptions(query) {
    const results = document.querySelector("[data-institution-results]");
    if (!results) return;
    const normalized = normalizeText(query);
    const options = state.instituciones.filter((institution) => {
      if (!normalized) return false;
      return normalizeText(institution.nombre).includes(normalized);
    }).slice(0, 12);
    renderInstitutionResults(options, normalized);
  }

  function renderInstitutionResults(options, hasQuery) {
    const results = document.querySelector("[data-institution-results]");
    if (!results) return;
    if (!hasQuery) {
      results.innerHTML = `<p class="empty-state compact">Buscá por nombre de escuela u organismo.</p>`;
      return;
    }
    if (!options.length) {
      results.innerHTML = `
        <p class="empty-state compact">No encontramos una institución con ese nombre.</p>
        <button class="outline-button" type="button" data-select-institution="manual">La institución no aparece en el listado</button>
      `;
      return;
    }
    results.innerHTML = `
      <span>${options.length} coincidencias</span>
      <div>
        ${options.map((institution) => `
          <article>
            <button type="button" data-select-institution="${escapeHtml(institution.id)}">
              <strong>${escapeHtml(institution.nombre)}</strong>
              <small>Seleccionar institución del listado</small>
            </button>
          </article>
        `).join("")}
      </div>
    `;
  }

  function selectInstitution(id) {
    const value = document.querySelector("[data-institution-value]");
    const selected = document.querySelector("[data-selected-institution]");
    if (!selected) return;

    if (id === "manual") {
      if (value) value.value = "manual";
      state.formValues.institucion = "manual";
      state.formValues.institucionNombre = "";
      selected.hidden = false;
      selected.innerHTML = `
        <span>Institución a cargar manualmente</span>
        <div class="institution-manual-grid">
          <label class="field"><span>Nombre de la institución</span><input type="text" data-field-id="institucionNombre" placeholder="Nombre de escuela u organismo"></label>
        </div>
        <button class="outline-button" type="button" data-clear-institution>Cambiar</button>
      `;
      return;
    }

    const institution = state.instituciones.find((item) => item.id === id);
    if (!institution) return;
    if (value) value.value = institution.id;
    state.formValues.institucion = institution.id;
    state.formValues.institucionNombre = institution.nombre;
    selected.hidden = false;
      selected.innerHTML = `
        <span>Institución seleccionada</span>
        <strong>${escapeHtml(institution.nombre)}</strong>
        <button class="outline-button" type="button" data-clear-institution>Cambiar</button>
      `;
  }

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const go = event.target.closest("[data-go]");
      if (go) view(go.dataset.go);

      const category = event.target.closest("[data-category]");
      if (category) {
        state.category = category.dataset.category;
        renderCategories();
        renderCatalog();
      }

      const homeCategory = event.target.closest("[data-home-category]");
      if (homeCategory) {
        state.homeCategory = homeCategory.dataset.homeCategory;
        renderHomeGuidance();
      }

      const roleOption = event.target.closest("[data-role-option]");
      if (roleOption) {
        state.managementMode = roleOption.dataset.roleOption;
        renderIdentification();
      }

      const faqCategory = event.target.closest("[data-faq-category]");
      if (faqCategory) {
        state.faqCategory = faqCategory.dataset.faqCategory;
        renderFaq();
      }

      const starter = event.target.closest("[data-start-form]");
      if (starter) {
        startWorkflow(starter.dataset.startForm);
      }

      const toastButton = event.target.closest("[data-toast]");
      if (toastButton) toast(toastButton.dataset.toast);

      const profileAction = event.target.closest("[data-profile-action]");
      if (profileAction?.dataset.profileAction === "seguimiento") {
        view("consulta");
        const lookupInput = document.querySelector("[data-lookup-form] input");
        if (lookupInput) lookupInput.value = state.currentRequest?.numero || "FME-2026-000001";
        renderHistory();
        toast("Seguimiento abierto con la solicitud seleccionada.");
      }
      if (profileAction?.dataset.profileAction === "adjuntar") {
        view("adjuntar");
        const uploadTracking = document.querySelector("[data-upload-form] input[type='text']");
        if (uploadTracking) uploadTracking.value = state.currentRequest?.numero || "FME-2026-000001";
      }

      const arcaActivity = event.target.closest("[data-select-arca-activity]");
      if (arcaActivity) selectArcaActivity(arcaActivity.dataset.selectArcaActivity);

      const clearArcaActivity = event.target.closest("[data-clear-arca-activity]");
      if (clearArcaActivity) {
        const selected = document.querySelector("[data-selected-arca-activity]");
        const value = document.querySelector("[data-arca-activity-value]");
        if (selected) selected.hidden = true;
        if (value) value.value = "";
        document.querySelector("[data-arca-activity-search]")?.focus();
      }

      const institution = event.target.closest("[data-select-institution]");
      if (institution) selectInstitution(institution.dataset.selectInstitution);

      const clearInstitution = event.target.closest("[data-clear-institution]");
      if (clearInstitution) {
        const selected = document.querySelector("[data-selected-institution]");
        const value = document.querySelector("[data-institution-value]");
        if (selected) selected.hidden = true;
        if (value) value.value = "";
        document.querySelector("[data-institution-search]")?.focus();
      }
    });

    document.addEventListener("change", async (event) => {
      const province = event.target.closest("[data-georef-province]");
      if (province) {
        const prefix = province.dataset.addressPrefix;
        const department = document.querySelector(`[data-georef-department][data-address-prefix="${prefix}"]`);
        const locality = document.querySelector(`[data-georef-locality][data-address-prefix="${prefix}"]`);
        resetSelect(locality, "Primero seleccioná departamento");
        setSelectOptions(department, [], "Cargando departamentos...");
        department.disabled = true;
        try {
          const departments = await loadGeorefDepartments(province.value);
          setSelectOptions(department, departments, "Seleccioná departamento");
        } catch (error) {
          resetSelect(department, "No se pudieron cargar departamentos");
          toast("No se pudieron cargar departamentos desde Georef.");
          console.error(error);
        }
      }

      const department = event.target.closest("[data-georef-department]");
      if (department) {
        const prefix = department.dataset.addressPrefix;
        const province = document.querySelector(`[data-georef-province][data-address-prefix="${prefix}"]`);
        const locality = document.querySelector(`[data-georef-locality][data-address-prefix="${prefix}"]`);
        setSelectOptions(locality, [], "Cargando localidades...");
        locality.disabled = true;
        try {
          const localities = await loadGeorefLocalities(province.value, department.value);
          setSelectOptions(locality, localities, "Seleccioná localidad");
        } catch (error) {
          resetSelect(locality, "No se pudieron cargar localidades");
          toast("No se pudieron cargar localidades desde Georef.");
          console.error(error);
        }
      }
    });

    document.querySelector("[data-catalog-search]")?.addEventListener("input", renderCatalog);
    document.querySelector("[data-need-input]")?.addEventListener("input", renderHomeGuidance);
    document.querySelector("[data-faq-search]")?.addEventListener("input", renderFaq);
    document.addEventListener("input", (event) => {
      const search = event.target.closest("[data-arca-activity-search]");
      if (search) filterArcaActivityOptions(search.value);
      const institutionSearch = event.target.closest("[data-institution-search]");
      if (institutionSearch) filterInstitutionOptions(institutionSearch.value);
      const derivationForm = event.target.closest("[data-derivation-form]");
      if (derivationForm) updateDerivationPreview(derivationForm);
      const statusForm = event.target.closest("[data-status-form]");
      if (statusForm) updateStatusPreview(statusForm);
      const field = event.target.closest("[data-field-id]");
      if (field?.dataset.fieldId) state.formValues[field.dataset.fieldId] = field.value;
    });
    document.addEventListener("change", (event) => {
      const derivationForm = event.target.closest("[data-derivation-form]");
      if (derivationForm) updateDerivationPreview(derivationForm);
      const statusForm = event.target.closest("[data-status-form]");
      if (statusForm) updateStatusPreview(statusForm);
      if (event.target.closest("[data-event-date]")) {
        const form = document.querySelector("[data-derivation-form]");
        if (form) updateDerivationPreview(form);
      }
      const field = event.target.closest("[data-field-id]");
      if (field?.dataset.fieldId) state.formValues[field.dataset.fieldId] = field.value;
      const uploadInput = event.target.closest("[data-upload-field]");
      if (uploadInput) {
        uploadNoteFile(uploadInput).catch((error) => {
          const field = uploadInput.dataset.uploadField;
          const status = document.querySelector(`[data-upload-status="${CSS.escape(field)}"]`);
          if (status) status.textContent = "No se pudo cargar el archivo.";
          toast(error.message);
        });
      }
    });
    document.querySelector("[data-wizard-prev]")?.addEventListener("click", () => {
      state.wizardStep = Math.max(0, state.wizardStep - 1);
      renderWizard();
    });
    document.querySelector("[data-wizard-next]")?.addEventListener("click", () => {
      const formSteps = currentForm().pasos.length;
      if (state.wizardStep >= formSteps - 1) {
        createSubmittedRequest();
        renderDashboard();
        renderProfile();
        view("confirmacion");
        return;
      }
      state.wizardStep += 1;
      renderWizard();
    });

    document.querySelector("[data-continue-to-form]")?.addEventListener("click", () => {
      captureIdentificationValues();
      renderWizard();
      view("formulario");
    });

    document.querySelector("[data-global-search]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      renderHomeGuidance();
      document.querySelector("[data-home-suggestions]")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

    document.querySelector("[data-lookup-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      toast("Encontramos el trámite de muestra FME-2026-000001");
    });

    document.querySelector("[data-upload-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      toast("Documentación enviada en modo demostración");
    });

    document.addEventListener("submit", (event) => {
      const profileForm = event.target.closest("[data-profile-form]");
      if (!profileForm) return;
      event.preventDefault();
      const data = Object.fromEntries(new FormData(profileForm).entries());
      state.user = { ...state.user, ...data };
      state.user.avatar = String(state.user.nombre || "MV").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
      renderProfile();
      toast("Datos del perfil actualizados en modo demostración.");
    });

    document.querySelector("[data-status-form]")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = Object.fromEntries(new FormData(form).entries());
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      button.textContent = "Actualizando...";
      try {
        updateCurrentStatus(data.estado);
        if (state.currentRequest) {
          state.currentRequest.estado = data.estado;
          renderDashboard();
          renderProfile();
        }
        addStatusHistory(data);
        if (data.notifyStatus) {
          await sendStatusNotification(data);
          toast("Estado actualizado y notificado por WhatsApp.");
        } else {
          toast("Estado actualizado en modo demostración.");
        }
      } catch (error) {
        toast(error.message);
      } finally {
        button.disabled = false;
        button.textContent = "Actualizar estado";
      }
    });

    document.querySelector("[data-derivation-form]")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = event.currentTarget.querySelector('button[type="submit"]');
      button.disabled = true;
      button.textContent = "Enviando...";
      try {
        await sendDerivationNotification(event.currentTarget);
        toast("Solicitud derivada y notificación enviada por WhatsApp.");
      } catch (error) {
        toast(error.message);
      } finally {
        button.disabled = false;
        button.textContent = "Derivar y notificar por WhatsApp";
      }
    });
  }

  async function init() {
    hydrateInlineIcons();
    bindEvents();
    try {
      [state.tramites, state.faqs, state.user, state.dashboard, state.history, state.formularios, state.arcaActivities, state.instituciones, state.georef, state.georefProvincias] = await Promise.all([
        getJson("mock/mock-tramites.json"),
        getJson("mock/mock-faq.json"),
        getJson("mock/mock-user.json"),
        getJson("mock/mock-dashboard.json"),
        getJson("mock/mock-history.json"),
        getJson("mock/mock-formularios.json"),
        getJson("mock/actividades-arca.json"),
        getJson("mock/mock-instituciones.json"),
        getJson("mock/georef-fme.json"),
        getJson("mock/georef-provincias.json")
      ]);
      renderCategories();
      renderHomeGuidance();
      renderCatalog();
      renderIdentification();
      renderWizard();
      renderHistory();
      renderFaq();
      renderProfile();
      renderDashboard();
    } catch (error) {
      toast("No se pudieron cargar los datos de muestra.");
      console.error(error);
    }
  }

  init();
}
