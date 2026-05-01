// src/components/Navbar.jsx
import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ShoppingBag, Menu, X, ChevronDown, ChevronRight,
  User, LogOut, Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { extractCategories } from "../utils/apiResponse";

// ─── Variantes de animación ────────────────────────────────────────
const mobileMenuVariants = {
  hidden:  { x: "100%", opacity: 0 },
  visible: { x: 0,      opacity: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit:    { x: "100%", opacity: 0, transition: { duration: 0.3, ease: [0.55, 0, 0.45, 1] } },
};

const megamenuVariants = {
  hidden:  { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0,  transition: { duration: 0.2, ease: "easeOut" } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

// ─── Submenu de tercer nivel ───────────────────────────────────────
function SubMenu({ items }) {
  return (
    <motion.div
      variants={megamenuVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="absolute left-full top-0 ml-3 z-[300] min-w-[200px]"
    >
      <div className="bg-white border border-neutral-100 rounded-2xl shadow-xl p-4">
        <ul className="space-y-1">
          {items.map((sub) => (
            <li key={sub.id}>
              <Link
                to={`/productos/categoria/${sub.slug}`}
                className="block px-3 py-2 text-[13px] font-semibold text-neutral-500 hover:text-black hover:bg-neutral-50 rounded-xl transition-all"
              >
                {sub.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

// ─── Item de categoría en el megamenu ─────────────────────────────
function MegaCategory({ cat }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="space-y-4">
      <Link
        to={`/productos/categoria/${cat.slug}`}
        className="block text-[10px] font-black uppercase tracking-[0.22em] text-black border-b border-neutral-100 pb-3 hover:opacity-60 transition-opacity"
      >
        {cat.name}
      </Link>
      <ul className="space-y-1">
        {cat.children?.map((sub) => (
          <li
            key={sub.id}
            className="relative"
            onMouseEnter={() => setHovered(sub.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <Link
              to={`/productos/categoria/${sub.slug}`}
              className="flex items-center justify-between px-3 py-2 text-[13px] font-semibold text-neutral-600 hover:text-black hover:bg-neutral-50 rounded-xl transition-all"
            >
              {sub.name}
              {sub.children?.length > 0 && (
                <ChevronRight size={13} className="text-neutral-300" />
              )}
            </Link>
            <AnimatePresence>
              {sub.children?.length > 0 && hovered === sub.id && (
                <SubMenu items={sub.children} />
              )}
            </AnimatePresence>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Mobile: categorías recursivas ────────────────────────────────
function MobileCategories({ nodes, level = 0, openMap, toggle }) {
  return nodes.map((node) => (
    <div key={node.id}>
      <div
        className={`flex justify-between items-center py-3.5 ${
          level === 0 ? "border-b border-neutral-100" : ""
        }`}
      >
        <Link
          to={`/productos/categoria/${node.slug}`}
          className={
            level === 0
              ? "text-[15px] font-black uppercase tracking-wide text-neutral-900"
              : "text-[14px] font-semibold text-neutral-600"
          }
        >
          {node.name}
        </Link>
        {node.children?.length > 0 && (
          <button
            onClick={() => toggle(node.id)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 active:bg-neutral-200 transition-colors"
          >
            <ChevronRight
              size={16}
              className={`text-neutral-500 transition-transform duration-300 ${
                openMap[node.id] ? "rotate-90" : ""
              }`}
            />
          </button>
        )}
      </div>
      <AnimatePresence>
        {node.children?.length > 0 && openMap[node.id] && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1, transition: { duration: 0.25 } }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.2 } }}
            className="overflow-hidden ml-4 pl-4 border-l border-neutral-100"
          >
            <MobileCategories
              nodes={node.children}
              level={level + 1}
              openMap={openMap}
              toggle={toggle}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  ));
}

// ─── Componente principal ──────────────────────────────────────────
export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { cart } = useCart();
  const location = useLocation();

  const [menuOpen,  setMenuOpen]  = useState(false);
  const [scrolled,  setScrolled]  = useState(false);
  const [megaOpen,  setMegaOpen]  = useState(false);
  const [openMap,   setOpenMap]   = useState({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const megaRef   = useRef(null);
  const searchRef = useRef(null);

  // Scroll listener
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cierra todo al cambiar ruta
  useEffect(() => {
    setMenuOpen(false);
    setMegaOpen(false);
    setSearchOpen(false);
    setOpenMap({});
    document.body.style.overflow = "unset";
  }, [location.pathname]);

  // Lock scroll cuando el menú móvil está abierto
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [menuOpen]);

  // Carga categorías
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    api.get("/categories")
      .then((res) => setCategories(extractCategories(res.data)))
      .catch(() => setCategories([]));
  }, []);

  // Cierra megamenu al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (megaRef.current && !megaRef.current.contains(e.target)) {
        setMegaOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleMobileSub = (id) =>
    setOpenMap((prev) => ({ ...prev, [id]: !prev[id] }));

  const cartCount = cart.reduce((s, i) => s + (i.quantity || 1), 0);

  return (
    <>
      {/* ── Barra principal ── */}
      <nav
        className={`fixed top-0 left-0 w-full z-[200] transition-all duration-500 ${
          scrolled
            ? "bg-white border-b border-neutral-100"
            : "bg-white/80 backdrop-blur-xl"
        }`}
      >
        <div className="max-w-[1540px] mx-auto px-4 sm:px-6 lg:px-10 h-16 lg:h-[72px] flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="relative z-[210] shrink-0">
            <span className="text-xl sm:text-2xl font-black tracking-tighter italic text-black">
              ALESTEB
            </span>
          </Link>

          {/* ── Nav desktop ── */}
          <div className="hidden md:flex items-center gap-1 h-full">
            <Link
              to="/productos"
              className="px-4 py-2 text-sm font-bold text-neutral-600 hover:text-black rounded-full hover:bg-neutral-50 transition-all"
            >
              Tienda
            </Link>

            {/* Megamenu trigger */}
            <div ref={megaRef} className="relative h-full flex items-center">
              <button
                onClick={() => setMegaOpen((v) => !v)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-full transition-all ${
                  megaOpen
                    ? "text-black bg-neutral-100"
                    : "text-neutral-600 hover:text-black hover:bg-neutral-50"
                }`}
              >
                Categorías
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-300 ${megaOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {megaOpen && categories.length > 0 && (
                  <motion.div
                    variants={megamenuVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[250]"
                    style={{ width: "min(900px, 90vw)" }}
                  >
                    <div className="bg-white border border-neutral-100 rounded-2xl shadow-2xl shadow-black/5 p-8">
                      <div
                        className="grid gap-8"
                        style={{
                          gridTemplateColumns: `repeat(${Math.min(categories.length, 4)}, 1fr)`,
                        }}
                      >
                        {categories.map((cat) => (
                          <MegaCategory key={cat.id} cat={cat} />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              to="/support"
              className="px-4 py-2 text-sm font-bold text-neutral-600 hover:text-black rounded-full hover:bg-neutral-50 transition-all"
            >
              Soporte
            </Link>
          </div>

          {/* ── Iconos derecha ── */}
          <div className="flex items-center gap-1 sm:gap-2">

            {/* Buscador desktop */}
            <div className="hidden sm:flex items-center relative">
              <AnimatePresence>
                {searchOpen && (
                  <motion.input
                    ref={searchRef}
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 200, opacity: 1, transition: { duration: 0.25 } }}
                    exit={{ width: 0, opacity: 0, transition: { duration: 0.2 } }}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar productos…"
                    autoFocus
                    className="absolute right-10 bg-neutral-50 border border-neutral-200 text-sm rounded-full px-4 py-2 outline-none focus:border-black transition-colors"
                    onKeyDown={(e) => {
                      if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); }
                    }}
                  />
                )}
              </AnimatePresence>
              <button
                onClick={() => { setSearchOpen((v) => !v); setSearchQuery(""); }}
                className="relative z-10 w-9 h-9 flex items-center justify-center text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors"
              >
                {searchOpen ? <X size={18} /> : <Search size={18} />}
              </button>
            </div>

            {/* Usuario desktop */}
            {isAuthenticated && user ? (
              <div className="hidden md:flex items-center gap-2 pl-3 border-l border-neutral-200 ml-1">
                <Link
                  to="/perfil"
                  className="flex flex-col items-end hover:opacity-60 transition-opacity"
                >
                  <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 leading-none mb-0.5">
                    Mi perfil
                  </span>
                  <span className="text-[13px] font-black text-black capitalize leading-none">
                    {user?.name?.split(" ")[0] || "Usuario"}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  title="Cerrar sesión"
                  className="w-9 h-9 flex items-center justify-center text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-full transition-all"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="hidden md:flex w-9 h-9 items-center justify-center text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <User size={18} />
              </Link>
            )}

            {/* Carrito */}
            <Link
              to="/carrito"
              className="relative w-9 h-9 flex items-center justify-center text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <ShoppingBag size={20} />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="absolute -top-0.5 -right-0.5 bg-black text-white text-[9px] font-black w-[18px] h-[18px] flex items-center justify-center rounded-full"
                  >
                    {cartCount > 9 ? "9+" : cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            {/* Hamburger — solo móvil */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden w-9 h-9 flex items-center justify-center text-black rounded-full hover:bg-neutral-100 transition-colors"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              <AnimatePresence mode="wait">
                {menuOpen ? (
                  <motion.span
                    key="x"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X size={22} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu size={22} />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Menú móvil ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[190] bg-white md:hidden flex flex-col overflow-hidden"
          >
            {/* Cabecera del menú móvil */}
            <div className="h-16 shrink-0 flex items-center justify-between px-4 border-b border-neutral-100">
              <span className="text-xl font-black tracking-tighter italic">ALESTEB</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-neutral-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cuerpo scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">

              {/* Búsqueda móvil */}
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar productos…"
                  className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-full text-sm outline-none focus:border-black transition-colors"
                />
              </div>

              {/* Usuario */}
              {isAuthenticated && user ? (
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
                  <div className="w-11 h-11 bg-black text-white rounded-full flex items-center justify-center font-black text-base shrink-0">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black uppercase italic truncate text-black">
                      {user?.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <Link to="/perfil" className="text-[11px] font-bold text-neutral-500 hover:text-black">
                        Mi perfil
                      </Link>
                      <span className="text-neutral-300">·</span>
                      <button onClick={logout} className="text-[11px] font-bold text-neutral-500 hover:text-black">
                        Salir
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-black text-white font-black text-sm uppercase tracking-wider italic"
                >
                  <User size={18} />
                  Iniciar sesión
                </Link>
              )}

              {/* Navegación rápida */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { to: "/productos", label: "Tienda" },
                  { to: "/carrito",   label: "Carrito" },
                  { to: "/support",   label: "Soporte" },
                  { to: "/perfil",    label: "Mi perfil" },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center justify-center py-3.5 rounded-2xl bg-neutral-50 border border-neutral-100 text-[13px] font-black uppercase tracking-wider text-neutral-700 hover:bg-neutral-100 transition-colors active:scale-95"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* Categorías */}
              {categories.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-neutral-400 mb-4">
                    Categorías
                  </p>
                  <MobileCategories
                    nodes={categories}
                    openMap={openMap}
                    toggle={toggleMobileSub}
                  />
                </div>
              )}
            </div>

            {/* Footer del menú */}
            <div className="shrink-0 px-5 py-4 border-t border-neutral-100">
              <p className="text-[10px] text-neutral-400 text-center font-bold uppercase tracking-widest">
                © {new Date().getFullYear()} Alesteb · Todos los derechos reservados
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer para que el contenido no quede bajo la navbar fija */}
      <div className="h-16 lg:h-[72px]" />
    </>
  );
}