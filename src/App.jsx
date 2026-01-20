import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";

export default function App() {
  return (
    <BrowserRouter>
      {/* NAVBAR FIJO */}
      <Navbar />

      {/* CONTENIDO — compensamos el navbar fixed */}
      <main className="pt-14 min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/productos" element={<Products />} />
          <Route path="/productos/:id" element={<ProductDetail />} />
        </Routes>
      </main>

      {/* FOOTER */}
      <Footer />
    </BrowserRouter>
  );
}
