function asObject(value) {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : {};
    } catch {
      return {};
    }
  }

  return {};
}

export function normalizeSocialLinks(value) {
  return asObject(value);
}

export function normalizeExternalUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw.replace(/^\/+/, "")}`;
}

export function whatsappUrl(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}

export function socialHref(linksValue, platform) {
  const links = normalizeSocialLinks(linksValue);
  const aliases = {
    instagram: ["instagram", "instagram_url", "ig"],
    facebook: ["facebook", "facebook_url", "fb"],
    twitter: ["twitter", "twitter_url", "x", "x_url"],
    youtube: ["youtube", "youtube_url"],
    tiktok: ["tiktok", "tiktok_url"],
    whatsapp: ["whatsapp", "whatsapp_url"],
  };

  for (const key of aliases[platform] || [platform]) {
    const value = links[key];
    if (!value) continue;

    if (platform === "whatsapp") {
      if (/wa\.me|whatsapp\.com/i.test(String(value))) {
        return normalizeExternalUrl(value);
      }
      return whatsappUrl(value);
    }

    return normalizeExternalUrl(value);
  }

  return "";
}

export function compactLocation(location = {}) {
  return [location.address, location.city, location.department, location.country]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .filter((value, index, all) => all.indexOf(value) === index)
    .join(", ");
}
