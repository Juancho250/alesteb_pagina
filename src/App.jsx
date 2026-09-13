// App.jsx  ─  ALESTEB_PAGINA/src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

// Debe vivir dentro de BrowserRouter porque usePageTracking consume useLocation.
function AppContent() {
  usePageTracking();

  return (
    <div className="storefront-shell">
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
