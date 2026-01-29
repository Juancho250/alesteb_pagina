import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { AuthProvider } from "./context/AuthContext"; // <--- IMPORTANTE

// Tus componentes...
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import CartFloating from "./components/CartFloating";
import ScrollToTop from "./components/ScrollToTop";
import Support from "./pages/Support";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import Orders from "./pages/Orders";

export default function App() {
  const [cart, setCart] = useState(() =>
    JSON.parse(localStorage.getItem("cart") || "[]")
  );

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const updateQuantity = (productId, newQty) => {
    if (newQty < 1) return;
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity: newQty } : item
      )
    );
  };

  const toggleCart = (product, quantity = 1) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) return prev.filter((item) => item.id !== product.id);

      const priceOriginal = product.price;
      const priceFinal = product.final_price || priceOriginal;

      return [
        ...prev,
        {
          ...product,
          quantity,
          price: priceOriginal,
          final_price: priceFinal,
          main_image: product.main_image || product.images?.[0]?.url || "",
        },
      ];
    });
  };

  const removeFromCart = (product) => {
    setCart((prev) => prev.filter((item) => item.id !== product.id));
  };

  return (
    <BrowserRouter>
      {/* AuthProvider envuelve TODO dentro del Router.
          Así el Navbar, las páginas y el carrito tienen acceso al usuario.
      */}
      <AuthProvider> 
        <ScrollToTop />
        <Navbar cart={cart} /> {/* Pasa cart si tu navbar muestra contador */}
        
        <main className="min-h-screen">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/productos" element={<Products cart={cart} toggleCart={toggleCart} />} />
            <Route path="/support" element={<Support />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/productos/:slug" element={<Products cart={cart} toggleCart={toggleCart} />} />
            <Route path="/productos/detalle/:id" element={<ProductDetail cart={cart} toggleCart={toggleCart} />} />
            <Route path="/orders" element={<Orders />} />
          </Routes>
        </main>

        <Footer />
        
        <CartFloating
          cart={cart}
          onRemove={removeFromCart}
          onUpdateQty={updateQuantity}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}