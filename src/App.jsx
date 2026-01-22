import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import CartFloating from "./components/CartFloating";
import { normalizePrice } from "./utils/price";


export default function App() {
  const [cart, setCart] = useState(() =>
    JSON.parse(localStorage.getItem("cart") || "[]")
  );

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const updateQuantity = (productId, newQty) => {
    if (newQty < 1) return; 
    setCart(prev => prev.map(item => 
      item.id === productId ? { ...item, quantity: newQty } : item
    ));
  };

const toggleCart = (product, quantity = 1) => {
  setCart((prev) => {
    const exists = prev.find((item) => item.id === product.id);
    if (exists) {
      return prev.filter((item) => item.id !== product.id);
    }

    const priceOriginal = normalizePrice(product.price);
    // CAMBIO AQUÍ: Usar 'let' en lugar de 'const'
    let priceFinal = normalizePrice(product.final_price) || priceOriginal;

    if (product.discount_type === "percentage" && product.discount_value > 0) {
      priceFinal = Math.round(
        priceOriginal * (1 - product.discount_value / 100)
      );
    }

    if (product.discount_type === "fixed" && product.discount_value > 0) {
      priceFinal = Math.max(
        priceOriginal - normalizePrice(product.discount_value),
        0
      );
    }

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
      <Navbar />
      <main className="pt-14 min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/productos" element={<Products cart={cart} toggleCart={toggleCart} />} />
          <Route path="/productos/:id" element={<ProductDetail cart={cart} toggleCart={toggleCart} />} />
        </Routes>
      </main>
      <Footer />
      <CartFloating 
        cart={cart} 
        onRemove={removeFromCart} 
        onUpdateQty={updateQuantity} 
      />
    </BrowserRouter>
  );
}