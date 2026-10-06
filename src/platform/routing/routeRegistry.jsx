import { lazy } from "react";

const Home = lazy(() => import("../../pages/Home"));
const Products = lazy(() => import("../../pages/Products"));
const ProductDetail = lazy(() => import("../../pages/ProductDetail"));
const Support = lazy(() => import("../../pages/Support"));
const Contact = lazy(() => import("../../pages/Contact"));
const Legal = lazy(() => import("../../pages/Legal"));
const Privacy = lazy(() => import("../../pages/Privacy"));
const CheckoutPage = lazy(() => import("../../pages/Checkoutpage"));
const Auth = lazy(() => import("../../pages/Auth"));
const Ordersuccesspage = lazy(() => import("../../pages/Ordersuccesspage"));
const ProfilePage = lazy(() => import("../../pages/ProfilePage"));
const CartPage = lazy(() => import("../../pages/CartPage"));
const FavoritesPage = lazy(() => import("../../pages/FavoritesPage"));

export const storefrontRouteRegistry = Object.freeze([
  { id: "home", path: "/", Component: Home },
  { id: "products", path: "/productos", Component: Products },
  { id: "product-detail", path: "/productos/detalle/:id", Component: ProductDetail },
  { id: "product-category", path: "/productos/categoria/:slug", Component: Products },
  { id: "support", path: "/support", Component: Support },
  { id: "contact", path: "/contact", Component: Contact },
  { id: "legal", path: "/legal", Component: Legal },
  { id: "privacy", path: "/privacidad", Component: Privacy },
  { id: "auth", path: "/auth", Component: Auth },
  { id: "checkout", path: "/checkout", Component: CheckoutPage },
  { id: "order-success", path: "/order-success", Component: Ordersuccesspage },
  { id: "profile", path: "/perfil", Component: ProfilePage },
  { id: "cart", path: "/carrito", Component: CartPage },
  { id: "favorites", path: "/favoritos", Component: FavoritesPage },
]);
