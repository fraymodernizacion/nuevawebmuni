const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "cms.json");
const UPLOAD_DIR = path.join(ROOT, "uploads", "notes");
const PORT = Number(process.env.PORT || 3000);
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;
const BUILDERBOT_ENDPOINT = process.env.BUILDERBOT_ENDPOINT || "";
const BUILDERBOT_TOKEN = process.env.BUILDERBOT_TOKEN || "";

const roles = {
  super_admin: {
    label: "Super admin",
    permissions: ["noticias", "organigrama", "contrataciones", "boletines", "usuarios"]
  },
  prensa: {
    label: "Prensa",
    permissions: ["noticias", "organigrama"]
  },
  hacienda: {
    label: "Hacienda",
    permissions: ["contrataciones"]
  },
  gobierno: {
    label: "Gobierno",
    permissions: ["boletines"]
  }
};

const adminPermissions = {
  "/admin-noticias.html": "noticias",
  "/admin-organigrama.html": "organigrama",
  "/admin-contrataciones.html": "contrataciones",
  "/admin-boletines.html": "boletines",
  "/admin-usuarios.html": "usuarios"
};

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".pdf": "application/pdf",
  ".svg": "image/svg+xml",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
};

const sessions = new Map();

function passwordHash(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function makeUser(id, name, email, role, password = "Cambiar123!") {
  const salt = crypto.randomBytes(16).toString("hex");
  return {
    id,
    name,
    email,
    role,
    status: "active",
    salt,
    passwordHash: passwordHash(password, salt)
  };
}

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DATA_FILE)) return;

  const now = new Date().toISOString();
  const data = {
    users: [
      makeUser("u-super-admin", "Super admin", "admin@fraymunicipalidad.gob.ar", "super_admin"),
      makeUser("u-prensa", "Área de Prensa", "prensa@fraymunicipalidad.gob.ar", "prensa"),
      makeUser("u-hacienda", "Secretaría de Hacienda", "hacienda@fraymunicipalidad.gob.ar", "hacienda"),
      makeUser("u-gobierno", "Secretaría de Gobierno", "gobierno@fraymunicipalidad.gob.ar", "gobierno")
    ],
    content: {
      noticias: [],
      organigrama: [],
      contrataciones: [],
      boletines: []
    },
    updatedAt: now
  };

  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function readData() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function writeData(data) {
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function publicUser(user) {
  if (!user) return null;
  const role = roles[user.role];
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    roleLabel: role?.label || user.role,
    status: user.status,
    permissions: role?.permissions || []
  };
}

function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || "").split(";").filter(Boolean).map((entry) => {
    const [key, ...value] = entry.trim().split("=");
    return [key, decodeURIComponent(value.join("="))];
  }));
}

function getSession(req) {
  const token = parseCookies(req).session;
  if (!token) return null;
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return session;
}

function currentUser(req) {
  const session = getSession(req);
  if (!session) return null;
  return readData().users.find((user) => user.id === session.userId && user.status === "active") || null;
}

function userCan(user, permission) {
  return Boolean(user && roles[user.role]?.permissions.includes(permission));
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function sendJson(res, status, payload, headers = {}) {
  send(res, status, JSON.stringify(payload), {
    "Content-Type": "application/json; charset=utf-8",
    ...headers
  });
}

function redirect(res, location) {
  send(res, 302, "", { Location: location });
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Payload demasiado grande"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("JSON inválido"));
      }
    });
  });
}

function readRawBody(req, maxBytes = 10_000_000) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error("Archivo demasiado grande"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function sanitizeFilename(filename) {
  const ext = path.extname(filename).toLowerCase();
  const base = path.basename(filename, ext)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "nota";
  return `${base}${ext}`;
}

function parseMultipartFile(buffer, boundary) {
  const marker = Buffer.from(`--${boundary}`);
  let start = buffer.indexOf(marker);
  while (start !== -1) {
    start += marker.length;
    if (buffer.slice(start, start + 2).toString() === "--") break;
    if (buffer.slice(start, start + 2).toString() === "\r\n") start += 2;

    const next = buffer.indexOf(marker, start);
    if (next === -1) break;
    let part = buffer.slice(start, next);
    if (part.slice(-2).toString() === "\r\n") part = part.slice(0, -2);

    const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd !== -1) {
      const headers = part.slice(0, headerEnd).toString("utf8");
      const content = part.slice(headerEnd + 4);
      const disposition = headers.match(/content-disposition:\s*([^\r\n]+)/i)?.[1] || "";
      const filename = disposition.match(/filename="([^"]+)"/i)?.[1];
      const name = disposition.match(/name="([^"]+)"/i)?.[1];
      const contentType = headers.match(/content-type:\s*([^\r\n]+)/i)?.[1]?.trim() || "application/octet-stream";
      if (filename) return { fieldName: name, filename, contentType, content };
    }

    start = next;
  }

  return null;
}

function serveFile(res, pathname) {
  const filePath = path.normalize(path.join(ROOT, pathname === "/" ? "index.html" : pathname));
  if (!filePath.startsWith(ROOT)) {
    send(res, 403, "Acceso denegado");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      send(res, 404, "Archivo no encontrado");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, data, {
      "Content-Type": contentTypes[ext] || "application/octet-stream"
    });
  });
}

function requirePermission(req, res, permission) {
  const user = currentUser(req);
  if (!user) {
    return { ok: false, user: null, handled: redirect(res, `/login.html?next=${encodeURIComponent(req.url)}`) };
  }
  if (!userCan(user, permission)) {
    return { ok: false, user, handled: send(res, 403, "No tenés permisos para acceder a esta sección.") };
  }
  return { ok: true, user };
}

async function handleApi(req, res, pathname) {
  if (pathname === "/api/uploads/note" && req.method === "POST") {
    const contentType = req.headers["content-type"] || "";
    const boundary = contentType.match(/boundary=(.+)$/)?.[1];
    if (!boundary) {
      sendJson(res, 400, { error: "La carga debe enviarse como multipart/form-data." });
      return;
    }

    const body = await readRawBody(req);
    const file = parseMultipartFile(body, boundary);
    if (!file || !file.content.length) {
      sendJson(res, 400, { error: "No se encontró ningún archivo para subir." });
      return;
    }

    const allowed = new Set([".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"]);
    const cleanName = sanitizeFilename(file.filename);
    const ext = path.extname(cleanName).toLowerCase();
    if (!allowed.has(ext)) {
      sendJson(res, 400, { error: "Formato no permitido. Usá PDF, JPG, PNG, DOC o DOCX." });
      return;
    }

    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const storedName = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${cleanName}`;
    const storedPath = path.join(UPLOAD_DIR, storedName);
    fs.writeFileSync(storedPath, file.content);

    const publicUrl = `/uploads/notes/${storedName}`;
    const absoluteUrl = new URL(publicUrl, `http://${req.headers.host}`).href;
    sendJson(res, 201, {
      ok: true,
      filename: cleanName,
      contentType: file.contentType,
      size: file.content.length,
      url: publicUrl,
      absoluteUrl
    });
    return;
  }

  if (pathname === "/api/operator/notify-whatsapp" && req.method === "POST") {
    const body = await readJsonBody(req);
    const number = String(body.number || "").replace(/\D/g, "");
    const area = String(body.area || "").trim();
    const observacion = String(body.observacion || "").trim();
    const includeSolicitud = Boolean(body.includeSolicitud);
    const solicitudOriginal = String(body.solicitudOriginal || "").trim();
    const notaUrl = String(body.notaUrl || "").trim();
    const tracking = String(body.tracking || "FME-2026-000001").trim();
    const fechaEvento = String(body.fechaEvento || "").trim();

    if (!number || !area || !observacion || !notaUrl) {
      sendJson(res, 400, { error: "Faltan datos para enviar la notificación." });
      return;
    }

    if (!BUILDERBOT_ENDPOINT || !BUILDERBOT_TOKEN) {
      sendJson(res, 503, {
        error: "La integración de WhatsApp no está configurada en el servidor.",
        missing: ["BUILDERBOT_ENDPOINT", "BUILDERBOT_TOKEN"]
      });
      return;
    }

    const lines = [
      `Nueva derivación de Mesa de Entrada: ${tracking}`,
      `Área destinataria: ${area}`,
    ];
    if (fechaEvento) {
      const [year, month, day] = fechaEvento.split("-");
      lines.push(`Fecha del evento o necesidad: ${day && month && year ? `${day}/${month}/${year}` : fechaEvento}`);
    }
    if (includeSolicitud && solicitudOriginal) {
      lines.push(`Solicitud original: ${solicitudOriginal}`);
    }
    lines.push(
      `Nota interna del operador: ${observacion}`,
      `Nota original: ${notaUrl}`
    );
    const content = lines.join("\n");

    const response = await fetch(BUILDERBOT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-builderbot": BUILDERBOT_TOKEN
      },
      body: JSON.stringify({
        messages: { content },
        number,
        checkIfExists: false
      })
    });

    const text = await response.text();
    let payload;
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { raw: text };
    }

    if (!response.ok) {
      sendJson(res, response.status, { error: "No se pudo enviar la notificación.", detail: payload });
      return;
    }

    sendJson(res, 200, { ok: true, content, provider: payload });
    return;
  }

  if (pathname === "/api/operator/notify-status-whatsapp" && req.method === "POST") {
    const body = await readJsonBody(req);
    const number = String(body.number || "").replace(/\D/g, "");
    const estado = String(body.estado || "").trim();
    const comentarioVisible = String(body.comentarioVisible || "").trim();
    const tracking = String(body.tracking || "FME-2026-000001").trim();

    if (!number || !estado || !comentarioVisible) {
      sendJson(res, 400, { error: "Faltan datos para notificar el cambio de estado." });
      return;
    }

    if (!BUILDERBOT_ENDPOINT || !BUILDERBOT_TOKEN) {
      sendJson(res, 503, {
        error: "La integración de WhatsApp no está configurada en el servidor.",
        missing: ["BUILDERBOT_ENDPOINT", "BUILDERBOT_TOKEN"]
      });
      return;
    }

    const content = [
      `Actualización de Mesa de Entrada: ${tracking}`,
      `Estado: ${estado}`,
      `Comentario: ${comentarioVisible}`
    ].join("\n");

    const response = await fetch(BUILDERBOT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-builderbot": BUILDERBOT_TOKEN
      },
      body: JSON.stringify({
        messages: { content },
        number,
        checkIfExists: false
      })
    });

    const text = await response.text();
    let payload;
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { raw: text };
    }

    if (!response.ok) {
      sendJson(res, response.status, { error: "No se pudo enviar la notificación de estado.", detail: payload });
      return;
    }

    sendJson(res, 200, { ok: true, content, provider: payload });
    return;
  }

  if (pathname === "/api/login" && req.method === "POST") {
    const { email, password } = await readJsonBody(req);
    const data = readData();
    const user = data.users.find((candidate) => candidate.email === String(email || "").trim().toLowerCase());
    const valid = user && user.status === "active" && passwordHash(String(password || ""), user.salt) === user.passwordHash;

    if (!valid) {
      sendJson(res, 401, { error: "Email o contraseña inválidos" });
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, { userId: user.id, expiresAt: Date.now() + SESSION_TTL_MS });
    sendJson(res, 200, { user: publicUser(user) }, {
      "Set-Cookie": `session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_MS / 1000}`
    });
    return;
  }

  if (pathname === "/api/logout" && req.method === "POST") {
    const token = parseCookies(req).session;
    if (token) sessions.delete(token);
    send(res, 204, "", {
      "Set-Cookie": "session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"
    });
    return;
  }

  if (pathname === "/api/me" && req.method === "GET") {
    sendJson(res, 200, { user: publicUser(currentUser(req)), roles });
    return;
  }

  const contentMatch = pathname.match(/^\/api\/content\/([a-z-]+)$/);
  if (contentMatch && ["GET", "PUT"].includes(req.method)) {
    const section = contentMatch[1];
    if (!["noticias", "organigrama", "contrataciones", "boletines"].includes(section)) {
      sendJson(res, 404, { error: "Sección inexistente" });
      return;
    }

    const auth = requirePermission(req, res, section);
    if (!auth.ok) return;

    const data = readData();
    if (req.method === "GET") {
      sendJson(res, 200, { items: data.content[section] || [] });
      return;
    }

    const body = await readJsonBody(req);
    data.content[section] = Array.isArray(body.items) ? body.items : [];
    writeData(data);
    sendJson(res, 200, { items: data.content[section] });
    return;
  }

  if (pathname === "/api/users" && ["GET", "PUT"].includes(req.method)) {
    const auth = requirePermission(req, res, "usuarios");
    if (!auth.ok) return;

    const data = readData();
    if (req.method === "GET") {
      sendJson(res, 200, { users: data.users.map(publicUser), roles });
      return;
    }

    const body = await readJsonBody(req);
    const users = Array.isArray(body.users) ? body.users : [];
    data.users = users.map((user) => {
      const existing = data.users.find((candidate) => candidate.id === user.id);
      return {
        ...(existing || makeUser(user.id || crypto.randomUUID(), user.name, user.email, user.role)),
        name: user.name,
        email: String(user.email || "").trim().toLowerCase(),
        role: roles[user.role] ? user.role : "prensa",
        status: user.status === "suspended" ? "suspended" : "active"
      };
    });
    writeData(data);
    sendJson(res, 200, { users: data.users.map(publicUser), roles });
    return;
  }

  sendJson(res, 404, { error: "Endpoint inexistente" });
}

const server = http.createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, `http://${req.headers.host}`);

    if (pathname.startsWith("/api/")) {
      await handleApi(req, res, pathname);
      return;
    }

    const permission = adminPermissions[pathname];
    if (permission) {
      const auth = requirePermission(req, res, permission);
      if (!auth.ok) return;
    }

    serveFile(res, pathname);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Error interno" });
  }
});

ensureDataFile();
server.listen(PORT, () => {
  console.log(`Servidor local listo: http://localhost:${PORT}`);
  console.log("Usuarios iniciales: admin/prensa/hacienda/gobierno @fraymunicipalidad.gob.ar");
  console.log("Contraseña inicial para todos: Cambiar123!");
});
