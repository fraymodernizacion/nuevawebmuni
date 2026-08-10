const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".main-nav");

menuButton?.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
});

nav?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    nav.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
  }
});

const previewSources = document.querySelectorAll("[data-preview-source]");
const previewTargets = document.querySelectorAll("[data-preview-target]");
const editorSurface = document.querySelector(".editor-surface");
const editorButtons = document.querySelectorAll("[data-format]");
const previewFrame = document.querySelector(".preview-frame");
const mediaUrlField = document.querySelector("[data-media-urls]");
const mediaButtons = document.querySelectorAll("[data-insert-media]");
const draggableMedia = document.querySelectorAll("[data-media-drag]");
const editorContextMenu = document.querySelector("[data-editor-context-menu]");
const editorContextButtons = document.querySelectorAll("[data-context-media]");
const editorContextFormatButtons = document.querySelectorAll("[data-context-format]");
const editorContextDeleteMedia = document.querySelector("[data-context-delete-media]");
const adminMode = document.body.dataset.adminMode || "news";
const bulletinFileField = document.querySelector("[data-bulletin-file]");
const loginForm = document.querySelector("[data-login-form]");
const loginError = document.querySelector("[data-login-error]");
let savedEditorRange = null;
let contextMediaTarget = null;

const previewTargetMap = Array.from(previewTargets).reduce((map, element) => {
  map[element.dataset.previewTarget] = element;
  return map;
}, {});

function formatAdminDate(value) {
  if (!value) return "Sin fecha";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function getPreviewSourceValue(field) {
  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) {
    return field.value.trim();
  }

  return field.innerHTML.trim();
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function mediaUrlsFromField() {
  if (!(mediaUrlField instanceof HTMLTextAreaElement)) return [];
  return mediaUrlField.value
    .split(/\n|,/)
    .map((url) => url.trim())
    .filter(Boolean);
}

function buildImageHtml(url, index = 1) {
  const safeUrl = escapeHtml(url);
  return `<figure class="body-image">
    <button class="media-remove" type="button" contenteditable="false" aria-label="Eliminar medio">×</button>
    <img src="${safeUrl}" alt="Imagen ${index} de la noticia">
    <figcaption>Imagen ${index} de la noticia</figcaption>
  </figure>`;
}

function buildCarouselHtml(urls) {
  const slides = urls.map((url, index) => {
    const safeUrl = escapeHtml(url);
    return `<figure>
      <img src="${safeUrl}" alt="Imagen ${index + 1} de la galería">
      <figcaption>Imagen ${index + 1} de la galería</figcaption>
    </figure>`;
  }).join("");

  return `<div class="news-carousel" aria-label="Galería de imágenes">
    <button class="media-remove" type="button" contenteditable="false" aria-label="Eliminar carrusel">×</button>
    ${slides}
  </div>`;
}

function videoEmbedUrl(url) {
  try {
    const parsed = new URL(url, window.location.href);
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }

    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v") || parsed.pathname.split("/").filter(Boolean).pop();
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }

    if (parsed.hostname.includes("vimeo.com")) {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : "";
    }
  } catch {
    return "";
  }

  return "";
}

function buildVideoHtml(url) {
  const safeUrl = escapeHtml(url);
  const embedUrl = videoEmbedUrl(url);

  if (embedUrl) {
    return `<figure class="body-video">
      <button class="media-remove" type="button" contenteditable="false" aria-label="Eliminar video">×</button>
      <iframe src="${escapeHtml(embedUrl)}" title="Video de la noticia" loading="lazy" allowfullscreen></iframe>
      <figcaption>Video de la noticia</figcaption>
    </figure>`;
  }

  return `<figure class="body-video">
    <button class="media-remove" type="button" contenteditable="false" aria-label="Eliminar video">×</button>
    <video src="${safeUrl}" controls></video>
    <figcaption>Video de la noticia</figcaption>
  </figure>`;
}

function lightboxScript() {
  return `<script>
    (() => {
      const lightbox = document.createElement("div");
      lightbox.className = "image-lightbox";
      lightbox.hidden = true;
      lightbox.innerHTML = '<button type="button" aria-label="Cerrar imagen ampliada">×</button><img alt="">';
      document.body.append(lightbox);
      const image = lightbox.querySelector("img");
      const close = () => {
        lightbox.hidden = true;
        image.removeAttribute("src");
      };
      lightbox.querySelector("button").addEventListener("click", close);
      lightbox.addEventListener("click", (event) => {
        if (event.target === lightbox) close();
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") close();
      });
      document.addEventListener("click", (event) => {
        const clicked = event.target.closest(".news-body .body-image img, .news-body .news-carousel img, .news-cover img");
        if (!clicked) return;
        image.src = clicked.currentSrc || clicked.src;
        image.alt = clicked.alt || "Imagen ampliada";
        lightbox.hidden = false;
      });
    })();
  <\/script>`;
}

function renderPublishedPreview(values) {
  if (!(previewFrame instanceof HTMLIFrameElement)) return;

  const baseHref = new URL(".", window.location.href).href;
  const title = escapeHtml(values.title || "Título de la noticia");
  const summary = escapeHtml(values.summary || "Bajada breve de la noticia.");
  const category = escapeHtml(values.category || "Categoría");
  const date = escapeHtml(formatAdminDate(values.date));
  const image = escapeHtml(values.image || "assets/optimized/fme-01.jpg");
  const body = (values.body || "<p>El cuerpo de la noticia aparecerá acá mientras se escribe.</p>")
    .replace(/<button[^>]*class="[^"]*media-remove[^"]*"[^>]*>[\s\S]*?<\/button>/gi, "");

  previewFrame.srcdoc = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <base href="${baseHref}">
    <title>${title}</title>
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="index.html" aria-label="Inicio">
        <img src="assets/optimized/fme-04.png" alt="Fray Municipalidad" width="1024" height="684" decoding="async">
      </a>
      <button class="icon-button menu-toggle" type="button" aria-label="Abrir menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
      <nav class="main-nav" aria-label="Menu principal">
        <a href="index.html#gobierno-abierto">Gobierno Abierto</a>
        <a href="gabinete.html">Gobierno</a>
      </nav>
    </header>

    <main>
      <article class="news-detail">
        <header class="news-detail-hero">
          <a class="back-link" href="index.html">Volver al inicio</a>
          <p class="kicker">${category}</p>
          <h1>${title}</h1>
          <div class="news-meta">
            <span>Publicado el ${date}</span>
            <span>Dirección de Comunicación</span>
          </div>
        </header>

        <figure class="news-cover">
          <img src="${image}" alt="Imagen principal de la noticia">
        </figure>

        <div class="news-body">
          <p class="lead">${summary}</p>
          ${body}
        </div>
      </article>
    </main>
    ${lightboxScript()}
  </body>
</html>`;
}

function bulletinCode(values) {
  const number = String(values.number || "").trim() || "00";
  const year = String(values.year || "").trim() || new Date().getFullYear();
  return `N° ${number}-${year}`;
}

function updateBulletinPreview() {
  const values = Array.from(previewSources).reduce((data, field) => {
    data[field.dataset.previewSource] = getPreviewSourceValue(field);
    return data;
  }, {});

  if (previewTargetMap.status) {
    previewTargetMap.status.textContent = values.status || "Borrador";
  }

  if (previewTargetMap.code) {
    previewTargetMap.code.textContent = bulletinCode(values);
  }

  if (previewTargetMap.date) {
    previewTargetMap.date.textContent = `Publicación: ${formatAdminDate(values.date)}`;
  }

  if (previewTargetMap.summary) {
    previewTargetMap.summary.textContent = values.summary || "Descripción breve del boletín municipal.";
  }

  if (previewTargetMap.title) {
    previewTargetMap.title.textContent = values.title || `Boletín Municipal ${bulletinCode(values)}`;
  }

  if (previewTargetMap.fileName) {
    previewTargetMap.fileName.textContent = values.file || "Sin archivo PDF cargado";
  }

  if (previewTargetMap.file instanceof HTMLAnchorElement) {
    const hasFile = Boolean(values.file);
    previewTargetMap.file.href = hasFile ? values.file : "#";
    previewTargetMap.file.textContent = hasFile ? "Descargar PDF" : "PDF pendiente";
  }
}

function updateAdminPreview() {
  if (adminMode === "bulletin") {
    updateBulletinPreview();
    return;
  }

  updateNewsPreview();
}

function selectionIsInsideEditor() {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount || !editorSurface) return false;
  return editorSurface.contains(selection.anchorNode);
}

function saveEditorSelection() {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount || !selectionIsInsideEditor()) return;
  savedEditorRange = selection.getRangeAt(0).cloneRange();
}

function restoreEditorSelection() {
  if (!savedEditorRange) return;
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(savedEditorRange);
}

function setEditorSelectionFromPoint(clientX, clientY) {
  if (!editorSurface) return;

  let range = null;
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(clientX, clientY);
  } else if (document.caretPositionFromPoint) {
    const position = document.caretPositionFromPoint(clientX, clientY);
    if (position) {
      range = document.createRange();
      range.setStart(position.offsetNode, position.offset);
    }
  }

  if (!range || !editorSurface.contains(range.startContainer)) return;

  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  saveEditorSelection();
}

function closestEditorBlock(node) {
  let current = node?.nodeType === Node.TEXT_NODE ? node.parentElement : node;
  while (current && current !== editorSurface) {
    if (["P", "H2", "H3", "BLOCKQUOTE", "LI"].includes(current.tagName)) return current;
    current = current.parentElement;
  }
  return null;
}

function getCurrentEditorBlock() {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount || !selection.anchorNode) return null;
  if (!selectionIsInsideEditor()) return null;
  return closestEditorBlock(selection.anchorNode);
}

function changeCurrentBlock(tagName) {
  const block = getCurrentEditorBlock();
  if (!block || block.tagName === tagName) return;

  const replacement = document.createElement(tagName.toLowerCase());
  replacement.innerHTML = block.innerHTML || "<br>";
  block.replaceWith(replacement);

  const range = document.createRange();
  range.selectNodeContents(replacement);
  range.collapse(false);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  saveEditorSelection();
}

function applyEditorFormat(format, value = null) {
  editorSurface?.focus();
  restoreEditorSelection();

  if (format === "formatBlock" && value) {
    changeCurrentBlock(value);
  } else {
    document.execCommand(format, false, value);
  }

  saveEditorSelection();
  updateEditorToolbarState();
  updateNewsPreview();
}

function insertHtmlAtEditorCursor(html) {
  if (!editorSurface) return;
  editorSurface.focus();
  restoreEditorSelection();

  const block = getCurrentEditorBlock();
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  const insertedNode = template.content.firstElementChild;
  if (!insertedNode) return;

  if (block) {
    block.after(insertedNode);
  } else {
    editorSurface.append(insertedNode);
  }

  const paragraph = document.createElement("p");
  paragraph.innerHTML = "<br>";
  insertedNode.after(paragraph);

  const range = document.createRange();
  range.setStart(paragraph, 0);
  range.collapse(true);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);

  saveEditorSelection();
  updateEditorToolbarState();
  updateNewsPreview();
}

function ensureMediaRemoveButtons() {
  editorSurface?.querySelectorAll(".body-image, .body-video, .news-carousel").forEach((media) => {
    if (media.querySelector(":scope > .media-remove")) return;
    const button = document.createElement("button");
    button.className = "media-remove";
    button.type = "button";
    button.contentEditable = "false";
    button.setAttribute("aria-label", "Eliminar medio");
    button.textContent = "×";
    media.prepend(button);
  });
}

function insertHtmlAfterPoint(html, clientX, clientY) {
  if (!editorSurface) return;
  editorSurface.focus();
  setEditorSelectionFromPoint(clientX, clientY);
  insertHtmlAtEditorCursor(html);
}

function updateEditorToolbarState() {
  const selection = window.getSelection();
  const block = selection?.anchorNode && selectionIsInsideEditor() ? closestEditorBlock(selection.anchorNode) : null;
  const blockTag = block?.tagName === "LI" ? "P" : block?.tagName;

  editorButtons.forEach((button) => {
    const format = button.dataset.format;
    const value = button.dataset.value;
    const isBlockButton = format === "formatBlock";
    const isActiveBlock = isBlockButton && value === blockTag;
    const isActiveInline = selectionIsInsideEditor() && (
      format === "bold" && document.queryCommandState("bold")
      || format === "italic" && document.queryCommandState("italic")
      || format === "insertUnorderedList" && document.queryCommandState("insertUnorderedList")
    );

    button.classList.toggle("active", Boolean(isActiveBlock || isActiveInline));
  });
}

function updateNewsPreview() {
  const values = Array.from(previewSources).reduce((data, field) => {
    data[field.dataset.previewSource] = getPreviewSourceValue(field);
    return data;
  }, {});

  renderPublishedPreview(values);

  if (previewTargetMap.title) {
    previewTargetMap.title.textContent = values.title || "Título de la noticia";
  }

  if (previewTargetMap.summary) {
    previewTargetMap.summary.textContent = values.summary || "Bajada breve de la noticia.";
  }

  if (previewTargetMap.category) {
    previewTargetMap.category.textContent = values.category || "Categoría";
  }

  if (previewTargetMap.date) {
    previewTargetMap.date.textContent = formatAdminDate(values.date);
  }

  if (previewTargetMap.body) {
    previewTargetMap.body.innerHTML = values.body || "<p>El cuerpo de la noticia aparecerá acá mientras se escribe.</p>";
  }

  if (previewTargetMap.image instanceof HTMLImageElement) {
    previewTargetMap.image.src = values.image || "assets/optimized/fme-01.jpg";
  }
}

editorButtons.forEach((button) => {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
  });

  button.addEventListener("mousedown", (event) => {
    event.preventDefault();
  });

  button.addEventListener("click", (event) => {
    event.preventDefault();
    applyEditorFormat(button.dataset.format, button.dataset.value || null);
  });
});

mediaButtons.forEach((button) => {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
  });

  button.addEventListener("click", (event) => {
    event.preventDefault();
    const urls = mediaUrlsFromField();
    if (!urls.length) {
      mediaUrlField?.focus();
      return;
    }

    let html = buildImageHtml(urls[0]);
    if (button.dataset.insertMedia === "video") {
      html = buildVideoHtml(urls[0]);
    } else if (button.dataset.insertMedia === "carousel" || urls.length > 1) {
      html = buildCarouselHtml(urls);
    }

    insertHtmlAtEditorCursor(html);
    if (mediaUrlField instanceof HTMLTextAreaElement) {
      mediaUrlField.value = "";
    }
  });
});

draggableMedia.forEach((button) => {
  button.addEventListener("dragstart", (event) => {
    event.dataTransfer?.setData("text/plain", button.dataset.mediaDrag || "");
    event.dataTransfer?.setData("text/html", buildImageHtml(button.dataset.mediaDrag || ""));
    event.dataTransfer.effectAllowed = "copy";
  });
});

editorSurface?.addEventListener("dragover", (event) => {
  event.preventDefault();
  editorSurface.classList.add("drag-over");
  if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
});

editorSurface?.addEventListener("dragleave", () => {
  editorSurface.classList.remove("drag-over");
});

editorSurface?.addEventListener("drop", (event) => {
  event.preventDefault();
  editorSurface.classList.remove("drag-over");
  const url = event.dataTransfer?.getData("text/plain") || "";
  if (!url) return;
  insertHtmlAfterPoint(buildImageHtml(url), event.clientX, event.clientY);
});

editorSurface?.addEventListener("click", (event) => {
  const removeButton = event.target.closest(".media-remove");
  if (!removeButton) return;
  event.preventDefault();
  const media = removeButton.closest(".body-image, .body-video, .news-carousel");
  media?.remove();
  updateNewsPreview();
});

function hideEditorContextMenu() {
  if (editorContextMenu instanceof HTMLElement) {
    editorContextMenu.hidden = true;
  }
}

function closestMediaBlock(node) {
  if (!(node instanceof Element)) return null;
  return node.closest(".body-image, .news-carousel, .body-video");
}

function showEditorContextMenu(clientX, clientY, mediaTarget = null) {
  if (!(editorContextMenu instanceof HTMLElement)) return;
  contextMediaTarget = mediaTarget;

  if (editorContextDeleteMedia instanceof HTMLButtonElement) {
    editorContextDeleteMedia.disabled = !contextMediaTarget;
    editorContextDeleteMedia.classList.toggle("danger", Boolean(contextMediaTarget));
  }

  editorContextMenu.hidden = false;

  const { innerWidth, innerHeight } = window;
  const rect = editorContextMenu.getBoundingClientRect();
  const left = Math.min(clientX, innerWidth - rect.width - 12);
  const top = Math.min(clientY, innerHeight - rect.height - 12);
  editorContextMenu.style.left = `${Math.max(12, left)}px`;
  editorContextMenu.style.top = `${Math.max(12, top)}px`;
}

function promptForMediaUrls(type) {
  const label = type === "carousel"
    ? "Pegá las rutas/URLs de las imágenes, una por línea o separadas por coma."
    : type === "video"
      ? "Pegá la URL del video. Puede ser YouTube, Vimeo o un archivo .mp4/.webm/.ogg."
      : "Pegá la ruta/URL de la imagen.";
  const example = type === "carousel"
    ? "assets/optimized/fme-05.jpg\nassets/optimized/fme-09.jpg"
    : type === "video"
      ? "https://youtu.be/..."
      : "assets/optimized/fme-06.jpg";
  const value = window.prompt(label, example);
  if (!value) return [];
  return value
    .split(/\n|,/)
    .map((url) => url.trim())
    .filter(Boolean);
}

editorSurface?.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  editorSurface.focus();
  setEditorSelectionFromPoint(event.clientX, event.clientY);
  showEditorContextMenu(event.clientX, event.clientY, closestMediaBlock(event.target));
});

editorContextButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const type = button.dataset.contextMedia;
    const urls = promptForMediaUrls(type);
    if (!urls.length) {
      hideEditorContextMenu();
      return;
    }

    const html = type === "video"
      ? buildVideoHtml(urls[0])
      : type === "carousel" || urls.length > 1
        ? buildCarouselHtml(urls)
        : buildImageHtml(urls[0]);

    insertHtmlAtEditorCursor(html);
    hideEditorContextMenu();
  });
});

editorContextFormatButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyEditorFormat(button.dataset.contextFormat, button.dataset.value || null);
    hideEditorContextMenu();
  });
});

editorContextDeleteMedia?.addEventListener("click", () => {
  if (!contextMediaTarget) return;
  const nextBlock = contextMediaTarget.nextElementSibling;
  contextMediaTarget.remove();

  if (nextBlock) {
    const range = document.createRange();
    range.selectNodeContents(nextBlock);
    range.collapse(true);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    saveEditorSelection();
  }

  contextMediaTarget = null;
  updateNewsPreview();
  hideEditorContextMenu();
});

document.addEventListener("click", (event) => {
  if (editorContextMenu?.contains(event.target)) return;
  hideEditorContextMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") hideEditorContextMenu();
});

editorSurface?.addEventListener("keyup", saveEditorSelection);
editorSurface?.addEventListener("mouseup", saveEditorSelection);
editorSurface?.addEventListener("focus", saveEditorSelection);
editorSurface?.addEventListener("input", saveEditorSelection);
editorSurface?.addEventListener("keyup", updateEditorToolbarState);
editorSurface?.addEventListener("mouseup", updateEditorToolbarState);
editorSurface?.addEventListener("focus", updateEditorToolbarState);
editorSurface?.addEventListener("input", updateEditorToolbarState);
document.addEventListener("selectionchange", () => {
  if (!selectionIsInsideEditor()) return;
  saveEditorSelection();
  updateEditorToolbarState();
});

editorSurface?.addEventListener("paste", (event) => {
  event.preventDefault();
  restoreEditorSelection();
  const text = event.clipboardData?.getData("text/plain") || "";
  document.execCommand("insertText", false, text);
  saveEditorSelection();
  updateEditorToolbarState();
});

previewSources.forEach((field) => {
  field.addEventListener("input", updateAdminPreview);
  field.addEventListener("change", updateAdminPreview);
});

if (previewSources.length) {
  ensureMediaRemoveButtons();
  updateAdminPreview();
}

bulletinFileField?.addEventListener("change", () => {
  if (!(bulletinFileField instanceof HTMLInputElement)) return;
  const file = bulletinFileField.files?.[0];
  if (!file) return;

  const pdfPathField = document.querySelector('[data-preview-source="file"]');
  if (pdfPathField instanceof HTMLInputElement) {
    pdfPathField.value = `assets/boletines/${file.name}`;
    updateAdminPreview();
  }
});

function setupPublicImageLightbox() {
  if (document.querySelector(".image-lightbox")) return;

  const lightbox = document.createElement("div");
  lightbox.className = "image-lightbox";
  lightbox.hidden = true;
  lightbox.innerHTML = '<button type="button" aria-label="Cerrar imagen ampliada">×</button><img alt="">';
  document.body.append(lightbox);

  const image = lightbox.querySelector("img");
  const close = () => {
    lightbox.hidden = true;
    image?.removeAttribute("src");
  };

  lightbox.querySelector("button")?.addEventListener("click", close);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
  document.addEventListener("click", (event) => {
    const clicked = event.target.closest(".news-body .body-image img, .news-body .news-carousel img, .news-cover img");
    if (!(clicked instanceof HTMLImageElement) || !image) return;
    image.src = clicked.currentSrc || clicked.src;
    image.alt = clicked.alt || "Imagen ampliada";
    lightbox.hidden = false;
  });
}

if (document.querySelector(".news-detail")) {
  setupPublicImageLightbox();
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!(loginForm instanceof HTMLFormElement)) return;

  const formData = new FormData(loginForm);
  const email = formData.get("email");
  const password = formData.get("password");

  if (loginError instanceof HTMLElement) {
    loginError.hidden = true;
    loginError.textContent = "";
  }

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "No se pudo iniciar sesión");
    }

    const next = new URLSearchParams(window.location.search).get("next");
    window.location.href = next || "admin-noticias.html";
  } catch (error) {
    if (loginError instanceof HTMLElement) {
      loginError.textContent = error.message || "No se pudo iniciar sesión";
      loginError.hidden = false;
    }
  }
});

async function applyAdminMenuPermissions() {
  const adminLinks = document.querySelectorAll(".admin-header-actions a[href^='admin-']");
  if (!adminLinks.length) return;

  const permissionsByPage = {
    "admin-noticias.html": "noticias",
    "admin-organigrama.html": "organigrama",
    "admin-contrataciones.html": "contrataciones",
    "admin-boletines.html": "boletines",
    "admin-usuarios.html": "usuarios"
  };

  try {
    const response = await fetch("/api/me");
    if (!response.ok) return;
    const { user } = await response.json();
    const permissions = new Set(user?.permissions || []);

    adminLinks.forEach((link) => {
      const href = link.getAttribute("href");
      const permission = permissionsByPage[href];
      if (permission && !permissions.has(permission)) {
        link.hidden = true;
      }
    });
  } catch {
    return;
  }
}

applyAdminMenuPermissions();
