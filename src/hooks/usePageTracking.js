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

// ── Configura aquí la URL de tu backend ──────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || "https://alesteb-back-1.onrender.com/api";
const ENDPOINT = `${API_BASE}/analytics/pageview`;

// Genera o recupera un ID de sesión anónimo por visita
function getSessionId() {
  let sid = sessionStorage.getItem("_alesteb_sid");
  if (!sid) {
    sid = `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
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
  "/contacto": "Contacto",
  "/support": "Soporte",
  "/legal": "Legal",
  "/privacidad": "Privacidad",
  "/auth": "Login / Registro",
  "/pedido-exitoso": "Pedido exitoso",
};

function getLabel(pathname) {
  // Rutas dinámicas
  if (pathname.startsWith("/productos/")) return "Detalle de producto";
  if (pathname.startsWith("/categoria/")) return "Categoría";
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

    // Envío al backend (fire-and-forget, no bloqueante)
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Si falla el envío, guardamos en localStorage como respaldo
      const stored = JSON.parse(localStorage.getItem("_alesteb_pageviews") || "[]");
      stored.push(payload);
      // Máximo 200 eventos en caché local
      if (stored.length > 200) stored.splice(0, stored.length - 200);
      localStorage.setItem("_alesteb_pageviews", JSON.stringify(stored));
    });

    // Actualizar refs para la próxima navegación
    prevPath.current = location.pathname;
    enteredAt.current = now;
  }, [location.pathname]);
}