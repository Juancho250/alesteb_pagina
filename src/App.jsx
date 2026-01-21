import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import CartFloating from "./components/CartFloating";

export default function App() {
  const [cart, setCart] = useState(() =>
    JSON.parse(localStorage.getItem("cart") || "[]")
  );

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const toggleCart = (product) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) return prev.filter((item) => item.id !== product.id);
      return [...prev, product];
    });
  };

  const removeFromCart = (product) => {
    setCart((prev) => prev.filter((item) => item.id !== product.id));
  };

  return (
    <BrowserRouter>
      <Navbar />

      <main className="pt-14 min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/productos"
            element={<Products cart={cart} toggleCart={toggleCart} />}
          />
          <Route
            path="/productos/:id"
            element={<ProductDetail cart={cart} toggleCart={toggleCart} />}
          />
        </Routes>
      </main>

      <Footer />

      {/* SOLO UN CARRITO FLOTANTE */}
      <CartFloating cart={cart} onRemove={removeFromCart} />
    </BrowserRouter>
  );
}
