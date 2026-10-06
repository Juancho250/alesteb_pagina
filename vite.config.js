import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const DEFAULT_BACKEND_ORIGIN = "https://alesteb-back-1ea2.onrender.com";
const DEFAULT_PUBLIC_ORIGIN = "https://alesteb.vercel.app";

function proxyOptions(env) {
  const target = String(
    env.STOREFRONT_BACKEND_ORIGIN || DEFAULT_BACKEND_ORIGIN
  ).trim().replace(/\/+$/, "");

  const publicOrigin = String(
    env.STOREFRONT_PUBLIC_ORIGIN || DEFAULT_PUBLIC_ORIGIN
  ).trim().replace(/\/+$/, "");

  const apiKey = String(env.STOREFRONT_API_KEY || "").trim();

  return {
    target,
    changeOrigin: true,
    secure: target.startsWith("https://"),
    rewrite: (path) => path.replace(/^\/api\/storefront/, ""),
    headers: {
      Origin: publicOrigin,
      ...(apiKey ? { "X-API-Key": apiKey } : {}),
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Empty prefix is intentional: these values are consumed only by the
  // Node-side Vite proxy and are never referenced through import.meta.env.
  const env = loadEnv(mode, process.cwd(), "");
  const storefrontProxy = proxyOptions(env);

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api/storefront": storefrontProxy,
      },
    },
    preview: {
      proxy: {
        "/api/storefront": storefrontProxy,
      },
    },
  };
});
