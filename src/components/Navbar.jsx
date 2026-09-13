import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useAppearance } from "../context/AppearanceContext";
import { extractCategories } from "../utils/apiResponse";

function Brand({ appearance, loading = false }) {
  const name = appearance?.business_name || "Tienda";
  const logo = appearance?.logo_url;

  if (loading) {
    return (
      <span className="flex items-center gap-2.5" aria-label="Cargando tienda">
        <span className="h-9 w-9 animate-pulse rounded-xl bg-[var(--store-surface-elevated)]" />
        <span className="h-4 w-24 animate-pulse rounded-full bg-[var(--store-surface-elevated)]" />
      </span>
    );
  }

  return (
    <span className="flex min-w-0 items-center gap-2.5">
      {logo ? (
        <img src={logo} alt="" className="h-9 w-9 shrink-0 rounded-xl object-contain" />
      ) : (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--store-brand)] text-xs font-bold text-[var(--store-brand-contrast)]">
          {name.charAt(0).toUpperCase() || "T"}
        </span>
      )}
      <span className="max-w-[170px] truncate text-[15px] font-semibold tracking-[-0.035em] text-[var(--store-navbar-text)] sm:max-w-[240px] sm:text-[16px]">
        {name}
      </span>
    </span>
  );
}

function CategoryMenu({ categories, onNavigate }) {
  if (!categories.length) return null;

  return (
    <div className="storefront-nav-popover absolute left-1/2 top-[calc(100%+12px)] z-50 w-[min(760px,calc(100vw-2rem))] -translate-x-1/2 p-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <div key={category.id} className="rounded-[18px] p-2 hover:bg-[var(--store-surface-hover)]">
            <Link
              to={`/productos/categoria/${category.slug}`}
              onClick={onNavigate}
              className="block rounded-xl px-3 py-2 text-sm font-semibold text-[var(--store-text-primary)]"
            >
              {category.name}
            </Link>
            {category.children?.length ? (
              <div className="px-3 pb-2">
                {category.children.slice(0, 4).map((child) => (
                  <Link
                    key={child.id}
                    to={`/productos/categoria/${child.slug}`}
                    onClick={onNavigate}
                    className="block py-1.5 text-xs text-[var(--store-text-muted)] hover:text-[var(--store-text-primary)]"
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileCategoryTree({ categories, onNavigate }) {
  return (
    <div className="divide-y divide-[var(--store-border)] border-y border-[var(--store-border)]">
      {categories.map((category) => (
        <div key={category.id} className="py-3">
          <Link
            to={`/productos/categoria/${category.slug}`}
            onClick={onNavigate}
            className="flex min-h-11 items-center text-sm font-semibold text-[var(--store-text-primary)]"
          >
            {category.name}
          </Link>
          {category.children?.length ? (
            <div className="flex flex-wrap gap-2 pb-1">
              {category.children.slice(0, 6).map((child) => (
                <Link
                  key={child.id}
                  to={`/productos/categoria/${child.slug}`}
                  onClick={onNavigate}
                  className="storefront-category-chip"
                >
                  {child.name}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { cart } = useCart();
  const { appearance, loading } = useAppearance();
  const location = useLocation();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    api.get("/categories", { signal: controller.signal })
      .then((response) => {
        const data = extractCategories(response.data);
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        if (error?.code !== "ERR_CANCELED") setCategories([]);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    setCategoryOpen(false);
    setMobileOpen(false);
    setSearchOpen(false);
    setSearchQuery("");
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key !== "Escape") return;
      setCategoryOpen(false);
      setMobileOpen(false);
      setSearchOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + Number(item.quantity || 1), 0),
    [cart]
  );

  function submitSearch(event) {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    navigate(`/productos?search=${encodeURIComponent(query)}`);
    setSearchOpen(false);
    setMobileOpen(false);
    setSearchQuery("");
  }

  const closeAll = () => {
    setCategoryOpen(false);
    setMobileOpen(false);
    setSearchOpen(false);
  };

  return (
    <>
      <header className="storefront-nav-wrap fixed inset-x-0 top-0 z-[200] px-3 pt-3 sm:px-5 sm:pt-4">
        <div className="storefront-nav mx-auto flex h-[58px] w-full max-w-[var(--store-content-width)] items-center gap-2 px-3 sm:h-[62px] sm:px-4">
          <Link to="/" onClick={closeAll} className="min-w-0 shrink-0">
            <Brand appearance={appearance} loading={loading} />
          </Link>

          <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Navegación principal">
            <Link
              to="/productos"
              className={`storefront-nav-link ${location.pathname.startsWith("/productos") ? "is-active" : ""}`}
            >
              Productos
            </Link>
            {categories.length ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCategoryOpen((current) => !current)}
                  className={`storefront-nav-link inline-flex items-center gap-1.5 ${categoryOpen ? "is-active" : ""}`}
                  aria-expanded={categoryOpen}
                >
                  Categorías <ChevronDown size={13} className={categoryOpen ? "rotate-180" : ""} />
                </button>
                {categoryOpen ? <CategoryMenu categories={categories} onNavigate={closeAll} /> : null}
              </div>
            ) : null}
            <Link to="/support" className="storefront-nav-link">Soporte</Link>
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <div className="relative hidden sm:block">
              {searchOpen ? (
                <form onSubmit={submitSearch} className="storefront-nav-search absolute right-0 top-1/2 flex -translate-y-1/2 items-center gap-1 p-1.5 pr-11">
                  <Search size={14} className="ml-2 shrink-0 text-[var(--store-text-muted)]" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    autoFocus
                    placeholder="Buscar productos"
                    className="w-[min(260px,42vw)] bg-transparent px-1 py-1.5 text-sm text-[var(--store-text-primary)] outline-none placeholder:text-[var(--store-text-muted)]"
                  />
                </form>
              ) : null}
              <button
                type="button"
                onClick={() => setSearchOpen((current) => !current)}
                className="storefront-nav-action relative z-10"
                aria-label={searchOpen ? "Cerrar búsqueda" : "Buscar"}
              >
                {searchOpen ? <X size={17} /> : <Search size={17} />}
              </button>
            </div>

            {isAuthenticated && user ? (
              <Link to="/perfil" className="storefront-nav-action hidden md:grid" aria-label="Mi cuenta">
                <User size={17} />
              </Link>
            ) : (
              <Link to="/auth" className="storefront-nav-action hidden md:grid" aria-label="Ingresar">
                <User size={17} />
              </Link>
            )}

            <Link to="/carrito" className="storefront-nav-action relative" aria-label={`Carrito${cartCount ? `, ${cartCount} productos` : ""}`}>
              <ShoppingBag size={18} />
              {cartCount > 0 ? (
                <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[var(--store-brand)] px-1 text-[9px] font-bold text-[var(--store-brand-contrast)]">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="storefront-nav-action md:hidden"
              aria-label="Abrir menú"
            >
              <Menu size={19} />
            </button>
          </div>
        </div>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[250] bg-[var(--store-page-bg)] md:hidden" role="dialog" aria-modal="true" aria-label="Menú">
          <div className="flex h-full flex-col">
            <div className="flex h-[70px] shrink-0 items-center justify-between border-b border-[var(--store-border)] px-4">
              <Link to="/" onClick={closeAll}>
                <Brand appearance={appearance} loading={loading} />
              </Link>
              <button type="button" onClick={() => setMobileOpen(false)} className="storefront-secondary-button !h-10 !min-h-10 !w-10 !p-0" aria-label="Cerrar menú">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5">
              <form onSubmit={submitSearch} className="storefront-surface flex items-center gap-2 px-4 py-2">
                <Search size={16} className="shrink-0 text-[var(--store-text-muted)]" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Buscar productos"
                  className="min-w-0 flex-1 bg-transparent py-2 text-base text-[var(--store-text-primary)] outline-none placeholder:text-[var(--store-text-muted)]"
                />
              </form>

              <nav className="mt-6 grid grid-cols-2 gap-2" aria-label="Navegación móvil">
                <Link to="/productos" onClick={closeAll} className="storefront-secondary-button">Productos</Link>
                <Link to="/support" onClick={closeAll} className="storefront-secondary-button">Soporte</Link>
                {isAuthenticated && user ? (
                  <Link to="/perfil" onClick={closeAll} className="storefront-secondary-button">Mi cuenta</Link>
                ) : (
                  <Link to="/auth" onClick={closeAll} className="storefront-secondary-button">Ingresar</Link>
                )}
                <Link to="/carrito" onClick={closeAll} className="storefront-secondary-button">Carrito {cartCount ? `(${cartCount})` : ""}</Link>
              </nav>

              {categories.length ? (
                <div className="mt-8">
                  <p className="storefront-kicker mb-3">Categorías</p>
                  <MobileCategoryTree categories={categories} onNavigate={closeAll} />
                </div>
              ) : null}

              {isAuthenticated && user ? (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    closeAll();
                  }}
                  className="mt-8 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--store-text-secondary)]"
                >
                  <LogOut size={16} /> Cerrar sesión
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="h-[82px] sm:h-[90px]" aria-hidden="true" />
    </>
  );
}
