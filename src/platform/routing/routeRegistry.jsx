import Home from "../../pages/Home";
import Products from "../../pages/Products";
import ProductDetail from "../../pages/ProductDetail";
import Support from "../../pages/Support";
import Contact from "../../pages/Contact";
import Legal from "../../pages/Legal";
import Privacy from "../../pages/Privacy";
import CheckoutPage from "../../pages/Checkoutpage";
import Auth from "../../pages/Auth";
import Ordersuccesspage from "../../pages/Ordersuccesspage";
import ProfilePage from "../../pages/ProfilePage";
import CartPage from "../../pages/CartPage";
import FavoritesPage from "../../pages/FavoritesPage";

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
