// App.jsx  ─  ALESTEB_PAGINA/src/App.jsx
import { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppearanceProvider } from "./context/AppearanceContext";
import { AuthProvider }      from "./context/AuthContext";
import { CartProvider }      from "./context/CartContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { DiscountsProvider }  from "./context/DiscountsContext";
import { usePageTracking }   from "./hooks/usePageTracking";
import { SiteRuntimeProvider, useSiteRuntime } from "./platform/runtime/SiteRuntimeContext";
import { storefrontRouteRegistry } from "./platform/routing/routeRegistry";

import Footer           from "./components/Footer";
import Navbar           from "./components/Navbar";
import CartFloating     from "./components/CartFloating";
import ScrollToTop      from "./components/ScrollToTop";

// ─── Componente interno que activa el tracker ─────────────────────────────────
// Debe vivir DENTRO de <BrowserRouter> porque usePageTracking usa useLocation.
function AppContent() {
  usePageTracking(); // ← registra cada cambio de página automáticamente

  return (
    <>
      <ScrollToTop />
      <Navbar />

      <main className="min-h-screen">
        <Suspense
          fallback={
            <div className="min-h-[55vh] flex items-center justify-center bg-[var(--store-page-bg,#ffffff)]">
              <div className="h-8 w-8 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin" />
            </div>
          }
        >
          <Routes>
            {storefrontRouteRegistry.map(({ id, path, Component }) => (
              <Route key={id} path={path} element={<Component />} />
            ))}
          </Routes>
        </Suspense>
      </main>

      <Footer />
      <CartFloating />
    </>
  );
}

function StorefrontGate() {
  const { fatalError, reload } = useSiteRuntime();

  // El perfil ya no bloquea el primer render. La tienda pinta de inmediato
  // con runtime cacheado/fallback y revalida /profile en segundo plano.
  if (fatalError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="max-w-md text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 mb-3">
            Tienda temporalmente no disponible
          </p>
          <h1 className="text-3xl font-black tracking-tight text-neutral-900 mb-3">
            No pudimos validar la conexión segura.
          </h1>
          <p className="text-sm text-neutral-500 mb-6">
            El catálogo está protegido contra configuraciones inválidas. Intenta nuevamente en unos segundos.
          </p>
          <button
            onClick={() => void reload()}
            className="px-6 py-3 rounded-full bg-neutral-900 text-white text-sm font-bold"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppearanceProvider>
      <AuthProvider>
        <FavoritesProvider>
          <CartProvider>
            <DiscountsProvider>
              <AppContent />
            </DiscountsProvider>
          </CartProvider>
        </FavoritesProvider>
      </AuthProvider>
    </AppearanceProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SiteRuntimeProvider>
        <StorefrontGate />
      </SiteRuntimeProvider>
    </BrowserRouter>
  );
}
