// App.jsx  ─  ALESTEB_PAGINA/src/App.jsx
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AppearanceProvider } from "./context/AppearanceContext";
import { AuthProvider }      from "./context/AuthContext";
import { CartProvider }      from "./context/CartContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { DiscountsProvider }  from "./context/DiscountsContext";
import { usePageTracking }   from "./hooks/usePageTracking";
import { SiteRuntimeProvider } from "./platform/runtime/SiteRuntimeContext";
import { storefrontRouteRegistry } from "./platform/routing/routeRegistry";
import "./styles/storefront.css";

import Footer           from "./components/Footer";
import Navbar           from "./components/Navbar";
import CartFloating     from "./components/CartFloating";
import ScrollToTop      from "./components/ScrollToTop";

function resolveStorefrontSurface(pathname) {
  if (pathname.startsWith("/productos/detalle/")) return "product-detail";
  if (pathname.startsWith("/productos")) return "catalog";
  if (pathname === "/carrito") return "cart";
  if (pathname === "/checkout") return "checkout";
  if (pathname === "/order-success") return "order-success";
  if (pathname === "/auth") return "auth";
  if (pathname === "/perfil") return "profile";
  if (pathname === "/favoritos") return "favorites";
  if (["/support", "/contact", "/legal", "/privacidad"].includes(pathname)) return "information";
  return "home";
}

// Debe vivir dentro de BrowserRouter porque usePageTracking consume useLocation.
function AppContent() {
  usePageTracking();
  const location = useLocation();
  const surface = resolveStorefrontSurface(location.pathname);

  return (
    <div className="storefront-shell" data-store-surface={surface}>
      <ScrollToTop />
      <Navbar />

      <main className="min-h-screen">
        <Routes>
          {storefrontRouteRegistry.map(({ id, path, Component }) => (
            <Route key={id} path={path} element={<Component />} />
          ))}
        </Routes>
      </main>

      <Footer />
      <CartFloating />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SiteRuntimeProvider>
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
      </SiteRuntimeProvider>
    </BrowserRouter>
  );
}
