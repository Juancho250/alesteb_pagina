const DEFAULT_BACKEND_ORIGIN = "https://alesteb-back-1ea2.onrender.com";
const DEFAULT_PUBLIC_ORIGIN = "https://alesteb.vercel.app";
const PUBLIC_API_PREFIX = "/public-api/v1";

function readBody(req) {
  if (["GET", "HEAD"].includes(req.method)) return Promise.resolve(null);

  if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body);
  if (typeof req.body === "string") return Promise.resolve(Buffer.from(req.body));
  if (req.body && typeof req.body === "object") {
    return Promise.resolve(Buffer.from(JSON.stringify(req.body)));
  }

  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    const maxBytes = 12 * 1024 * 1024;

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(Object.assign(new Error("PAYLOAD_TOO_LARGE"), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(chunks.length ? Buffer.concat(chunks) : null));
    req.on("error", reject);
  });
}

function forwardedHeaders(req) {
  const headers = {
    "X-API-Key": process.env.STOREFRONT_API_KEY || "",
    Origin: process.env.STOREFRONT_PUBLIC_ORIGIN || DEFAULT_PUBLIC_ORIGIN,
    Accept: req.headers.accept || "application/json",
  };

  for (const name of [
    "authorization",
    "content-type",
    "idempotency-key",
    "x-session-id",
    "user-agent",
  ]) {
    const value = req.headers[name];
    if (typeof value === "string" && value) headers[name] = value;
  }

  return headers;
}

export default async function handler(req, res) {
  const apiKey = String(process.env.STOREFRONT_API_KEY || "").trim();
  if (!apiKey) {
    return res.status(503).json({
      success: false,
      code: "STOREFRONT_PROXY_NOT_CONFIGURED",
      message: "La tienda no está disponible temporalmente.",
    });
  }

  const backendOrigin = String(
    process.env.STOREFRONT_BACKEND_ORIGIN || DEFAULT_BACKEND_ORIGIN
  ).trim().replace(/\/+$/, "");

  const incoming = new URL(req.url, DEFAULT_PUBLIC_ORIGIN);
  const pathname = incoming.pathname.replace(/^\/api\/storefront/, "");

  if (
    !pathname.startsWith(`${PUBLIC_API_PREFIX}/`) &&
    pathname !== PUBLIC_API_PREFIX
  ) {
    return res.status(404).json({
      success: false,
      code: "STOREFRONT_PROXY_ROUTE_NOT_FOUND",
      message: "Ruta no encontrada.",
    });
  }

  let body;
  try {
    body = await readBody(req);
  } catch (error) {
    const status = error?.status === 413 ? 413 : 400;
    return res.status(status).json({
      success: false,
      code: status === 413 ? "PAYLOAD_TOO_LARGE" : "INVALID_REQUEST_BODY",
      message: status === 413
        ? "El archivo o solicitud supera el tamaño permitido."
        : "No fue posible leer la solicitud.",
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const upstream = await fetch(
      `${backendOrigin}${pathname}${incoming.search}`,
      {
        method: req.method,
        headers: forwardedHeaders(req),
        body,
        redirect: "manual",
        signal: controller.signal,
      }
    );

    res.status(upstream.status);

    for (const header of ["content-type", "cache-control", "etag", "location", "retry-after"]) {
      const value = upstream.headers.get(header);
      if (value) res.setHeader(header, value);
    }

    const responseBody = Buffer.from(await upstream.arrayBuffer());
    return res.end(responseBody);
  } catch (error) {
    console.error("[storefront-proxy]", error?.name || "UPSTREAM_ERROR");
    return res.status(502).json({
      success: false,
      code: "STOREFRONT_UPSTREAM_UNAVAILABLE",
      message: "No fue posible conectar con la tienda.",
    });
  } finally {
    clearTimeout(timeout);
  }
}
