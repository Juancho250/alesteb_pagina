// ─── usePageTracking.js ───────────────────────────────────────────────────────
// Coloca este archivo en: ALESTEB_PAGINA/src/hooks/usePageTracking.js
//
// Cómo usarlo:
//   En App.jsx (o tu layout raíz), simplemente importa y llama al hook:
//
//   import { usePageTracking } from "./hooks/usePageTracking";
//   function App() {
//     usePageTracking();
//     return <RouterOutlet />;
//   }
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { STOREFRONT_API_BASE_URL } from "../services/storefrontConfig";

const ENDPOINT = `${STOREFRONT_API_BASE_URL}/analytics/pageview`;

// Genera o recupera un ID de sesión anónimo por visita
function getSessionId() {
  let sid = sessionStorage.getItem("_alesteb_sid");
  if (!sid) {
    const randomPart = globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
    sid = `s_${randomPart}`;
    sessionStorage.setItem("_alesteb_sid", sid);
  }
  return sid;
}

// Nombres legibles para cada ruta
const PAGE_LABELS = {
  "/": "Inicio",
  "/productos": "Productos",
  "/carrito": "Carrito",
  "/checkout": "Checkout",
  "/favoritos": "Favoritos",
  "/perfil": "Perfil",
  "/contact": "Contacto",
  "/support": "Soporte",
  "/legal": "Legal",
  "/privacidad": "Privacidad",
  "/auth": "Login / Registro",
  "/order-success": "Pedido exitoso",
};

function getLabel(pathname) {
  // Rutas dinámicas
  if (pathname.startsWith("/productos/categoria/")) return "Categoría";
  if (pathname.startsWith("/productos/detalle/")) return "Detalle de producto";
  return PAGE_LABELS[pathname] || pathname;
}

export function usePageTracking() {
  const location = useLocation();
  const enteredAt = useRef(Date.now());
  const prevPath = useRef(null);

  useEffect(() => {
    const sessionId = getSessionId();
    const now = Date.now();
    const timeOnPrev = Math.round((now - enteredAt.current) / 1000); // segundos

    const payload = {
      sessionId,
      page: location.pathname,
      pageLabel: getLabel(location.pathname),
      referrer: prevPath.current,
      referrerLabel: prevPath.current ? getLabel(prevPath.current) : null,
      timeOnPrevPage: prevPath.current ? timeOnPrev : null,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      screenW: window.screen.width,
      screenH: window.screen.height,
      // Si el usuario está autenticado puedes agregar su ID aquí
      // userId: authUser?.id ?? null,
    };

    // Analytics no debe competir con LCP, catálogo o perfil durante el arranque.
    const send = () => {
      fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        keepalive: true,
      })
        .then((response) => {
          if (!response.ok) throw new Error(`PAGEVIEW_HTTP_${response.status}`);
        })
        .catch(() => {
          const stored = JSON.parse(localStorage.getItem("_alesteb_pageviews") || "[]");
          stored.push(payload);
          if (stored.length > 200) stored.splice(0, stored.length - 200);
          localStorage.setItem("_alesteb_pageviews", JSON.stringify(stored));
        });
    };

    let idleId = null;
    let timeoutId = null;
    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(send, { timeout: 1600 });
    } else {
      timeoutId = window.setTimeout(send, 1200);
    }

    // Actualizar refs para la próxima navegación
    prevPath.current = location.pathname;
    enteredAt.current = now;

    return () => {
      if (idleId != null) window.cancelIdleCallback?.(idleId);
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, [location.pathname]);
}