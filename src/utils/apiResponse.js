export function extractCollection(payload, keys = []) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  for (const key of keys) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nested = extractCollection(value, keys);
      if (nested.length > 0) return nested;
    }
  }

  return [];
}

export function extractProducts(payload) {
  return extractCollection(payload, ["products", "data", "items", "rows"]);
}

export function extractCategories(payload) {
  return extractCollection(payload, ["categories", "data", "items", "rows"]);
}

export function extractBanners(payload) {
  return extractCollection(payload, ["banners", "data", "items", "rows"]);
}

export function extractPagination(payload) {
  if (!payload || typeof payload !== "object") {
    return { totalPages: 1, totalItems: 0 };
  }

  const sources = [payload, payload.data, payload.meta].filter(
    (source) => source && typeof source === "object"
  );

  for (const source of sources) {
    const pagination = source.pagination;
    if (pagination && typeof pagination === "object") {
      return {
        totalPages: Number(pagination.totalPages || pagination.total_pages || 1),
        totalItems: Number(pagination.totalItems || pagination.total_items || 0),
      };
    }

    if ("totalPages" in source || "total_pages" in source) {
      return {
        totalPages: Number(source.totalPages || source.total_pages || 1),
        totalItems: Number(source.totalItems || source.total_items || 0),
      };
    }
  }

  return { totalPages: 1, totalItems: 0 };
}
