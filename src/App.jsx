// App.jsx  ─  ALESTEB_PAGINA/src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider }      from "./context/AuthContext";
import { CartProvider }      from "./context/CartContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { usePageTracking }   from "./hooks/usePageTracking";  // ← hook de tracking

import Home             from "./pages/Home";
import Products         from "./pages/Products";
import ProductDetail    from "./pages/ProductDetail";
import Footer           from "./components/Footer";
import Navbar           from "./components/Navbar";
import CartFloating     from "./components/CartFloating";
import ScrollToTop      from "./components/ScrollToTop";
import Support          from "./pages/Support";
import Contact          from "./pages/Contact";
import Legal            from "./pages/Legal";
import Privacy          from "./pages/Privacy";
import CheckoutPage     from "./pages/Checkoutpage";
import Auth             from "./pages/Auth";
import Ordersuccesspage from "./pages/Ordersuccesspage";
import ProfilePage      from "./pages/ProfilePage";
import CartPage         from "./pages/CartPage";
import FavoritesPage    from "./pages/FavoritesPage";

// ─── Componente interno que activa el tracker ─────────────────────────────────
// Debe vivir DENTRO de <BrowserRouter> porque usePageTracking usa useLocation.
function AppContent() {
  usePageTracking(); // ← registra cada cambio de página automáticamente

  return (
    <>
      <ScrollToTop />
      <Navbar />

      <main className="min-h-screen">
        <Routes>
          <Route path="/"                          element={<Home />} />
          <Route path="/productos"                 element={<Products />} />
          <Route path="/productos/detalle/:id"     element={<ProductDetail />} />
          <Route path="/productos/categoria/:slug" element={<Products />} />
          <Route path="/support"                   element={<Support />} />
          <Route path="/contact"                   element={<Contact />} />
          <Route path="/legal"                     element={<Legal />} />
          <Route path="/privacidad"                element={<Privacy />} />
          <Route path="/auth"                      element={<Auth />} />
          <Route path="/checkout"                  element={<CheckoutPage />} />
          <Route path="/order-success"             element={<Ordersuccesspage />} />
          <Route path="/perfil"                    element={<ProfilePage />} />
          <Route path="/carrito"                   element={<CartPage />} />
          <Route path="/favoritos"                 element={<FavoritesPage />} />
        </Routes>
      </main>

      <Footer />
      <CartFloating />
    </>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FavoritesProvider>
          <CartProvider>
            <AppContent />   {/* ← todo adentro del Router */}
          </CartProvider>
        </FavoritesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}