import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import CartFloating from "./components/CartFloating";
import ScrollToTop from "./components/ScrollToTop";
import Support from "./pages/Support";
import Contact from "./pages/Contact";
import Legal from "./pages/Legal";
import Privacy from "./pages/Privacy";
import CheckoutPage from "./pages/Checkoutpage";
import Auth from "./pages/Auth";
import Ordersuccesspage from "./pages/Ordersuccesspage";
import ProfilePage from "./pages/ProfilePage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ScrollToTop />
          <Navbar />  

          <main className="min-h-screen">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/productos" element={<Products />} />
              <Route path="/productos/:slug" element={<Products />} />
              <Route path="/productos/detalle/:id" element={<ProductDetail />} />
              <Route path="/support" element={<Support />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/legal" element={<Legal />} />
              <Route path="/privacidad" element={<Privacy />} />  
              <Route path="/auth" element={<Auth />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order-success" element={<Ordersuccesspage/>} />
              <Route path="/perfil" element={<ProfilePage />} />
            </Routes>
          </main>

          <Footer />
          <CartFloating />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}