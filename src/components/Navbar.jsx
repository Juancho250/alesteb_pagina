import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShoppingBag, Menu, X, ChevronDown, ChevronRight,
  User, LogOut, Search, LayoutGrid,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useAppearance } from "../context/AppearanceContext";
import { extractCategories } from "../utils/apiResponse";

// ─── Variantes ────────────────────────────────────────────────
const dropDown = {
  hidden:  { opacity: 0, y: -8, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1,    transition: { duration: 0.2,  ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.15 } },
};

const mobileSlide = {
  hidden:  { x: "100%", opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.36, ease: [0.22, 1, 0.36, 1] } },
  exit:    { x: "100%", opacity: 0, transition: { duration: 0.26, ease: [0.55, 0, 0.45, 1] } },
};

// ─── MegaMenu de 3 columnas ───────────────────────────────────
function MegaMenu({ categories, accentColor, onClose }) {
  const [activeTop, setActiveTop] = useState(categories[0]?.id ?? null);
  const [activeSub, setActiveSub] = useState(null);

  const topCat    = categories.find(c => c.id === activeTop);
  const subCat    = topCat?.children?.find(c => c.id === activeSub);
  const hasLevel2 = (topCat?.children?.length ?? 0) > 0;
  const hasLevel3 = (subCat?.children?.length ?? 0) > 0;

  const accent = accentColor || "#000000";

  return (
    <motion.div
      variants={dropDown}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="absolute top-[calc(100%+10px)] left-1/2 -translate-x-1/2 z-[250]"
      style={{ width: "min(860px, 92vw)" }}
    >
      {/* Puntero */}
      <div className="absolute -top-[7px] left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white border-l border-t border-neutral-200 rotate-45" />

      <div
        className="bg-white border border-neutral-200 rounded-2xl shadow-2xl overflow-hidden flex"
        style={{ minHeight: 300 }}
      >
        {/* ── Columna 1: categorías raíz ── */}
        <div className="w-[200px] shrink-0 bg-neutral-50/80 border-r border-neutral-100 py-2 flex flex-col">
          <p className="px-4 pt-3 pb-2 text-[9.5px] font-black uppercase tracking-[0.22em] text-neutral-400 select-none">
            Categorías
          </p>
          {categories.map(cat => {
            const active = activeTop === cat.id;
            return (
              <button
                key={cat.id}
                onMouseEnter={() => { setActiveTop(cat.id); setActiveSub(null); }}
                className={`group flex items-center justify-between w-full px-4 py-2.5 text-[13px] font-semibold text-left transition-all ${
                  active
                    ? "bg-white text-black"
                    : "text-neutral-500 hover:text-black hover:bg-white/60"
                }`}
                style={active ? { boxShadow: `inset 2px 0 0 ${accent}` } : {}}
              >
                <Link
                  to={`/productos/categoria/${cat.slug}`}
                  onClick={onClose}
                  className="flex-1 text-left"
                >
                  {cat.name}
                </Link>
                {cat.children?.length > 0 && (
                  <ChevronRight
                    size={12}
                    className={`shrink-0 transition-colors ${active ? "text-neutral-400" : "text-neutral-300 group-hover:text-neutral-400"}`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Columna 2: subcategorías ── */}
        <div className="w-[200px] shrink-0 border-r border-neutral-100 py-2 flex flex-col">
          <AnimatePresence mode="wait">
            {hasLevel2 ? (
              <motion.div
                key={activeTop}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0, transition: { duration: 0.16 } }}
                exit={{ opacity: 0 }}
                className="flex flex-col h-full"
              >
                <p className="px-4 pt-3 pb-2 text-[9.5px] font-black uppercase tracking-[0.22em] text-neutral-400 select-none">
                  {topCat?.name}
                </p>
                {topCat.children.map(sub => {
                  const active = activeSub === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onMouseEnter={() => setActiveSub(sub.id)}
                      className={`group flex items-center justify-between w-full px-4 py-2.5 text-[13px] font-semibold text-left transition-all ${
                        active
                          ? "bg-neutral-50 text-black"
                          : "text-neutral-500 hover:text-black hover:bg-neutral-50/80"
                      }`}
                    >
                      <Link
                        to={`/productos/categoria/${sub.slug}`}
                        onClick={onClose}
                        className="flex-1 text-left"
                      >
                        {sub.name}
                      </Link>
                      {sub.children?.length > 0 && (
                        <ChevronRight
                          size={12}
                          className={`shrink-0 transition-colors ${active ? "text-neutral-400" : "text-neutral-300 group-hover:text-neutral-400"}`}
                        />
                      )}
                    </button>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="empty-l2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex items-center justify-center"
              >
                <p className="text-[12px] text-neutral-300 font-medium">Sin subcategorías</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Columna 3: tercer nivel ── */}
        <div className="flex-1 py-2 flex flex-col">
          <AnimatePresence mode="wait">
            {hasLevel3 ? (
              <motion.div
                key={activeSub}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0, transition: { duration: 0.16 } }}
                exit={{ opacity: 0 }}
              >
                <p className="px-4 pt-3 pb-2 text-[9.5px] font-black uppercase tracking-[0.22em] text-neutral-400 select-none">
                  {subCat?.name}
                </p>
                <div className="grid grid-cols-2 px-2 gap-x-1">
                  {subCat.children.map(item => (
                    <Link
                      key={item.id}
                      to={`/productos/categoria/${item.slug}`}
                      onClick={onClose}
                      className="px-3 py-2.5 text-[13px] font-medium text-neutral-500 hover:text-black hover:bg-neutral-50 rounded-xl transition-all"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </motion.div>
            ) : hasLevel2 ? (
              <motion.div
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex items-center justify-center"
              >
                <p className="text-[12px] text-neutral-300 font-medium">
                  {activeSub ? "Sin sub-subcategorías" : "← Elige una subcategoría"}
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Árbol recursivo mobile ────────────────────────────────────
function MobileTree({ nodes, level = 0, openMap, toggle, onClose }) {
  return nodes.map(node => (
    <div key={node.id}>
      <div className={`flex items-center gap-2 ${level === 0 ? "py-3 border-b border-neutral-100" : "py-2.5"}`}>
        <Link
          to={`/productos/categoria/${node.slug}`}
          onClick={onClose}
          className={`flex-1 ${
            level === 0
              ? "text-[14px] font-black uppercase tracking-wide text-neutral-900"
              : level === 1
              ? "text-[13px] font-bold text-neutral-700"
              : "text-[13px] font-medium text-neutral-500"
          }`}
        >
          {node.name}
        </Link>
        {node.children?.length > 0 && (
          <button
            onClick={() => toggle(node.id)}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-neutral-100 active:bg-neutral-200 shrink-0"
          >
            <ChevronRight
              size={13}
              className={`text-neutral-500 transition-transform duration-200 ${openMap[node.id] ? "rotate-90" : ""}`}
            />
          </button>
        )}
      </div>
      <AnimatePresence>
        {node.children?.length > 0 && openMap[node.id] && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1, transition: { duration: 0.2 } }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.15 } }}
            className="overflow-hidden ml-3 pl-3 border-l-2 border-neutral-100"
          >
            <MobileTree
              nodes={node.children}
              level={level + 1}
              openMap={openMap}
              toggle={toggle}
              onClose={onClose}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  ));
}

// ─── Brand: logo + nombre desde AppearanceContext ──────────────
function BrandLogo({ appearance, loading, textLight }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2.5 animate-pulse">
        <div className="w-8 h-8 rounded-lg bg-neutral-200 shrink-0" />
        <div className="h-4 w-24 rounded bg-neutral-200" />
      </div>
    );
  }

  const name       = appearance?.business_name || "Mi Tienda";
  const logo       = appearance?.logo_url;
  const brandColor = appearance?.primary_color || "#000000";
  const nameColor  = textLight ? "#ffffff" : brandColor;

  return (
    <div className="flex items-center gap-2.5">
      {logo ? (
        <img
          src={logo}
          alt={name}
          className="h-8 w-8 object-contain rounded-lg shrink-0 select-none"
          onError={e => { e.currentTarget.style.display = "none"; }}
          draggable={false}
        />
      ) : (
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[13px] font-black shrink-0 select-none"
          style={{ backgroundColor: brandColor }}
        >
          {name[0]?.toUpperCase() || "T"}
        </div>
      )}
      <span
        className="text-[17px] sm:text-[19px] font-black tracking-tight select-none leading-none"
        style={{ color: nameColor }}
      >
        {name}
      </span>
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────
export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { cart } = useCart();
  const { appearance, loading: profileLoad } = useAppearance() ?? {};
  const location = useLocation();
  const navigate = useNavigate();

  const [menuOpen,    setMenuOpen]    = useState(false);
  const [scrolled,    setScrolled]    = useState(false);
  const [megaOpen,    setMegaOpen]    = useState(false);
  const [openMap,     setOpenMap]     = useState({});
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories,  setCategories]  = useState([]);

  const megaRef = useRef(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setMegaOpen(false);
    setSearchOpen(false);
    setOpenMap({});
    document.body.style.overflow = "unset";
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [menuOpen]);

  useEffect(() => {
    api.get("/categories")
      .then(res => setCategories(extractCategories(res.data)))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const fn = e => {
      if (megaRef.current && !megaRef.current.contains(e.target)) setMegaOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const toggleMobileSub = id => setOpenMap(prev => ({ ...prev, [id]: !prev[id] }));
  const cartCount   = cart.reduce((s, i) => s + (i.quantity || 1), 0);
  const accent      = appearance?.primary_color || "#000";
  const textLight   = appearance?.store_navbar_text === "light";
  const navBg       = appearance?.store_navbar_bg || "#ffffff";

  // CSS class helpers that adapt to navbar text mode
  const linkCls = textLight
    ? "text-white/70 hover:text-white hover:bg-white/10"
    : "text-neutral-500 hover:text-black hover:bg-neutral-100";
  const iconCls = textLight
    ? "text-white/70 hover:text-white hover:bg-white/10"
    : "text-neutral-600 hover:text-black hover:bg-neutral-100";
  const cartCls = textLight
    ? "text-white hover:bg-white/10"
    : "text-neutral-800 hover:bg-neutral-100";
  const menuToggleCls = textLight
    ? "text-white hover:bg-white/10"
    : "text-black hover:bg-neutral-100";
  const borderCls = textLight ? "border-white/15" : "border-neutral-150";
  const authDividerCls = textLight ? "border-white/20" : "border-neutral-200";

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-[200] transition-all duration-300 ${
          scrolled
            ? `border-b ${borderCls} shadow-sm shadow-black/[0.05]`
            : "backdrop-blur-xl"
        }`}
        style={{ backgroundColor: navBg }}
      >
        <div className="max-w-[1540px] mx-auto px-4 sm:px-6 lg:px-10 h-16 lg:h-[68px] flex items-center gap-3">

          <Link to="/" className="shrink-0 mr-1 z-[210]">
            <BrandLogo appearance={appearance} loading={profileLoad} textLight={textLight} />
          </Link>

          <nav className="hidden md:flex items-center gap-0.5 flex-1">
            <Link
              to="/productos"
              className={`px-3.5 py-2 text-[13px] font-semibold rounded-xl transition-all ${
                location.pathname.startsWith("/productos")
                  ? (textLight ? "text-white bg-white/10" : "text-black bg-neutral-100")
                  : linkCls
              }`}
            >
              Tienda
            </Link>

            <div ref={megaRef} className="relative h-[68px] flex items-center">
              <button
                onClick={() => setMegaOpen(v => !v)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold rounded-xl transition-all ${
                  megaOpen
                    ? (textLight ? "text-white bg-white/10" : "text-black bg-neutral-100")
                    : linkCls
                }`}
              >
                <LayoutGrid size={13} className="shrink-0" />
                Categorías
                <ChevronDown size={12} className={`shrink-0 transition-transform duration-200 ${megaOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {megaOpen && categories.length > 0 && (
                  <MegaMenu
                    categories={categories}
                    accentColor={accent}
                    onClose={() => setMegaOpen(false)}
                  />
                )}
              </AnimatePresence>
            </div>

            <Link
              to="/support"
              className={`px-3.5 py-2 text-[13px] font-semibold rounded-xl transition-all ${linkCls}`}
            >
              Soporte
            </Link>
          </nav>

          <div className="flex items-center gap-1 ml-auto">

            <div className="hidden sm:flex items-center relative">
              <AnimatePresence>
                {searchOpen && (
                  <motion.input
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 210, opacity: 1, transition: { duration: 0.2 } }}
                    exit={{ width: 0, opacity: 0, transition: { duration: 0.16 } }}
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar…"
                    autoFocus
                    className="absolute right-10 bg-neutral-50 border border-neutral-200 text-[13px] rounded-xl px-3.5 py-2 outline-none focus:border-black transition-colors"
                    onKeyDown={e => {
                      if (e.key === "Enter" && searchQuery.trim()) {
                        navigate(`/productos?search=${encodeURIComponent(searchQuery.trim())}`);
                        setSearchOpen(false);
                        setSearchQuery("");
                      }
                      if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); }
                    }}
                  />
                )}
              </AnimatePresence>
              <button
                onClick={() => { setSearchOpen(v => !v); setSearchQuery(""); }}
                aria-label={searchOpen ? "Cerrar búsqueda" : "Abrir búsqueda"}
                className={`relative z-10 w-9 h-9 flex items-center justify-center rounded-xl transition-all ${iconCls}`}
              >
                {searchOpen ? <X size={17} /> : <Search size={17} />}
              </button>
            </div>

            {isAuthenticated && user ? (
              <div className={`hidden md:flex items-center gap-1 pl-3 border-l ml-1 ${authDividerCls}`}>
                <Link
                  to="/perfil"
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all ${textLight ? "hover:bg-white/10" : "hover:bg-neutral-100"}`}
                >
                  <div
                    className="w-7 h-7 rounded-lg text-white flex items-center justify-center text-[11px] font-black shrink-0"
                    style={{ backgroundColor: appearance?.primary_color || "#000" }}
                  >
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="flex flex-col items-start leading-none">
                    <span className={`text-[12px] font-bold ${textLight ? "text-white" : "text-black"}`}>
                      {user?.name?.split(" ")[0]}
                    </span>
                    <span className={`text-[10px] mt-0.5 font-medium ${textLight ? "text-white/50" : "text-neutral-400"}`}>
                      Mi cuenta
                    </span>
                  </div>
                </Link>
                <button
                  onClick={logout}
                  title="Cerrar sesión"
                  className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${iconCls}`}
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className={`hidden md:flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold rounded-xl transition-all ${linkCls}`}
              >
                <User size={15} />
                Ingresar
              </Link>
            )}

            <Link
              to="/carrito"
              aria-label={`Carrito${cartCount > 0 ? `, ${cartCount} ${cartCount === 1 ? "ítem" : "ítems"}` : ""}`}
              className={`relative w-9 h-9 flex items-center justify-center rounded-xl transition-all ${cartCls}`}
            >
              <ShoppingBag size={19} />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 26 }}
                    className="absolute -top-0.5 -right-0.5 text-white text-[9px] font-black w-[17px] h-[17px] flex items-center justify-center rounded-full tabular-nums"
                    style={{ backgroundColor: accent }}
                  >
                    {cartCount > 9 ? "9+" : cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            <button
              onClick={() => setMenuOpen(v => !v)}
              className={`md:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-all ${menuToggleCls}`}
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              <AnimatePresence mode="wait">
                {menuOpen
                  ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.16 }}><X size={20} /></motion.span>
                  : <motion.span key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.16 }}><Menu size={20} /></motion.span>
                }
              </AnimatePresence>
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            variants={mobileSlide}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[190] bg-white md:hidden flex flex-col overflow-hidden"
          >
            <div
              className="h-16 shrink-0 flex items-center justify-between px-4 border-b"
              style={{
                backgroundColor: navBg,
                borderColor: textLight ? "rgba(255,255,255,0.15)" : undefined,
              }}
            >
              <BrandLogo appearance={appearance} loading={profileLoad} textLight={textLight} />
              <button
                onClick={() => setMenuOpen(false)}
                className={`w-9 h-9 flex items-center justify-center rounded-xl ${textLight ? "bg-white/10 text-white" : "bg-neutral-100 text-neutral-700"}`}
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar productos…"
                  className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-[13px] outline-none focus:border-black transition-colors"
                  onKeyDown={e => {
                    if (e.key === "Enter" && e.target.value.trim()) {
                      navigate(`/productos?search=${encodeURIComponent(e.target.value.trim())}`);
                      setMenuOpen(false);
                    }
                  }}
                />
              </div>

              {isAuthenticated && user ? (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100">
                  <div
                    className="w-10 h-10 text-white rounded-xl flex items-center justify-center font-black text-sm shrink-0"
                    style={{ backgroundColor: appearance?.primary_color || "#000" }}
                  >
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black text-black truncate">{user?.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Link to="/perfil" onClick={() => setMenuOpen(false)} className="text-[11px] font-bold text-neutral-500 hover:text-black">Mi perfil</Link>
                      <span className="text-neutral-300">·</span>
                      <button onClick={logout} className="text-[11px] font-bold text-neutral-500 hover:text-black">Salir</button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-black text-[13px] uppercase tracking-widest"
                  style={{ backgroundColor: appearance?.primary_color || "#000" }}
                >
                  <User size={15} />
                  Iniciar sesión
                </Link>
              )}

              <div className="grid grid-cols-3 gap-2">
                {[
                  { to: "/productos", label: "Tienda" },
                  { to: "/carrito",   label: "Carrito" },
                  { to: "/support",   label: "Soporte" },
                ].map(item => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center py-3 rounded-xl bg-neutral-50 border border-neutral-100 text-[12px] font-black uppercase tracking-wide text-neutral-700 hover:bg-neutral-100 active:scale-95 transition-all"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              {categories.length > 0 && (
                <div>
                  <p className="text-[9.5px] font-black uppercase tracking-[0.22em] text-neutral-400 mb-3 select-none">
                    Categorías
                  </p>
                  <MobileTree
                    nodes={categories}
                    openMap={openMap}
                    toggle={toggleMobileSub}
                    onClose={() => setMenuOpen(false)}
                  />
                </div>
              )}
            </div>

            <div className="shrink-0 px-4 py-3 border-t border-neutral-100">
              <p className="text-[10px] text-neutral-400 text-center font-bold uppercase tracking-widest">
                © {new Date().getFullYear()} {appearance?.business_name || "Mi Tienda"} · Todos los derechos reservados
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-16 lg:h-[68px]" />
    </>
  );
}
