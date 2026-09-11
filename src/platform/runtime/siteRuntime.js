export const SITE_RUNTIME_SCHEMA_VERSION = 1;

export const SITE_RUNTIME_SOURCE = "public-profile-compat";

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : null;
}

export function extractPublicProfile(response) {
  const axiosResponse = asObject(response);
  const payload = asObject(axiosResponse?.data);

  if (!payload) return null;

  if (
    Object.prototype.hasOwnProperty.call(payload, "success") &&
    Object.prototype.hasOwnProperty.call(payload, "data")
  ) {
    return asObject(payload.data);
  }

  return payload;
}

export function createSiteRuntime(profile) {
  const publicProfile = asObject(profile);

  return {
    schemaVersion: SITE_RUNTIME_SCHEMA_VERSION,
    source: SITE_RUNTIME_SOURCE,
    status: publicProfile ? "resolved" : "fallback",
    identity: {
      businessName: publicProfile?.business_name ?? "",
      description: publicProfile?.description ?? "",
      contact: {
        email: publicProfile?.business_email ?? "",
        phone: publicProfile?.business_phone ?? "",
        website: publicProfile?.website ?? "",
      },
      location: {
        address: publicProfile?.address ?? "",
        city: publicProfile?.city ?? "",
        department: publicProfile?.department ?? "",
        country: publicProfile?.country ?? "",
      },
      socialLinks: publicProfile?.social_links ?? null,
    },
    brand: {
      tagline: publicProfile?.tagline ?? "",
      assets: {
        logoUrl: publicProfile?.logo_url ?? "",
        faviconUrl: publicProfile?.favicon_url ?? "",
      },
      colors: {
        primary: publicProfile?.primary_color ?? null,
        secondary: publicProfile?.secondary_color ?? null,
        accent: publicProfile?.accent_color ?? null,
      },
    },
    locale: {
      currency: publicProfile?.currency ?? null,
    },
    site: {
      presentation: {
        navbarBackground: publicProfile?.store_navbar_bg ?? null,
        navbarText: publicProfile?.store_navbar_text ?? null,
        pageBackground: publicProfile?.store_page_bg ?? "#ffffff",
        fontFamily: publicProfile?.store_font ?? null,
      },
      manifest: null,
    },
    compatibility: {
      publicProfile,
    },
  };
}

export const FALLBACK_SITE_RUNTIME = createSiteRuntime(null);
