const DEFAULT_BACKEND_ORIGIN = "https://alesteb-back-1ea2.onrender.com";
const DEFAULT_PUBLIC_ORIGIN = "https://alesteb.vercel.app";
const PUBLIC_API_PREFIX = "/public-api/v1";

const EDGE_CACHE_POLICIES = [
  { test: /^\/public-api\/v1\/profile$/, ttl: 60, swr: 300 },
  { test: /^\/public-api\/v1\/banners$/, ttl: 15, swr: 60 },
  { test: /^\/public-api\/v1\/categories$/, ttl: 30, swr: 120 },
  { test: /^\/public-api\/v1\/discounts$/, ttl: 10, swr: 30 },
  { test: /^\/public-api\/v1\/products$/, ttl: 8, swr: 30 },
  { test: /^\/public-api\/v1\/products\/\d+$/, ttl: 8, swr: 30 },
  { test: /^\/public-api\/v1\/products\/\d+\/reviews$/, ttl: 10, swr: 30 },
];

function applyEdgeCachePolicy(req, res, pathname, upstream) {
  if (req.method !== "GET" || !upstream.ok) return false;

  const policy = EDGE_CACHE_POLICIES.find(({ test }) => test.test(pathname));
  if (!policy) return false;

  const value =
    `public, max-age=0, s-maxage=${policy.ttl}, stale-while-revalidate=${policy.swr}`;

  res.setHeader("Cache-Control", value);
  res.setHeader("Vercel-CDN-Cache-Control", value);
  res.setHeader("X-ALESTEB-Edge-Cache", `s-maxage=${policy.ttl}`);
  return true;
}

function normalizeProxyPath(value) {
  const raw = Array.isArray(value) ? value.join("/") : String(value || "");
  const clean = raw.replace(/^\/+/, "");
  return clean ? `/${clean}` : "";
}

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

  const pathname = normalizeProxyPath(req.query?.path);
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

  const query = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(req.query || {})) {
    if (key === "path") continue;
    for (const value of Array.isArray(rawValue) ? rawValue : [rawValue]) {
      if (value !== undefined && value !== null) query.append(key, String(value));
    }
  }
  const search = query.toString() ? `?${query.toString()}` : "";

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
      `${backendOrigin}${pathname}${search}`,
      {
        method: req.method,
        headers: forwardedHeaders(req),
        body,
        redirect: "manual",
        signal: controller.signal,
      }
    );

    res.status(upstream.status);

    const edgeCached = applyEdgeCachePolicy(req, res, pathname, upstream);
    for (const header of ["content-type", "etag", "location", "retry-after"]) {
      const value = upstream.headers.get(header);
      if (value) res.setHeader(header, value);
    }

    if (!edgeCached) {
      const upstreamCacheControl = upstream.headers.get("cache-control");
      if (upstreamCacheControl) {
        res.setHeader("Cache-Control", upstreamCacheControl);
      } else if (req.method !== "GET") {
        res.setHeader("Cache-Control", "no-store");
      }
    }

    return res.end(Buffer.from(await upstream.arrayBuffer()));
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
