import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = (file) => readFileSync(join(root, file), "utf8");

test("homepage never resurrects unpublished products from localStorage", () => {
  const home = source("src/pages/Home.jsx");
  assert.match(home, /const \[featuredProducts, setFeaturedProducts\] = useState\(\[\]\)/);
  assert.doesNotMatch(home, /readPublicCache\("home-products"/);
  assert.match(home, /loadPublicJson\(\`\/products\?limit=\$\{productLimit\}\`, productCacheKey\)/);
});

test("catalog verifies fresh visibility before displaying product cards", () => {
  const catalog = source("src/pages/Products.jsx");
  assert.match(catalog, /setLoading\(true\);\s+setProducts\(\[\]\);\s+setResolvedKey\(null\)/);
  assert.match(catalog, /loadPublicJson\(\`\/products\?\$\{params\}\`/);
  assert.doesNotMatch(catalog, /const cached\s*= cacheGet\(cacheKey\)/);
});

test("direct product links confirm publication before rendering", () => {
  const detail = source("src/pages/ProductDetail.jsx");
  assert.match(detail, /setProduct\(null\);\s+setLoading\(true\)/);
  assert.match(detail, /loadPublicJson\(\`\/products\/\$\{id\}\`/);
  assert.doesNotMatch(detail, /const cached = cacheGet\(id\)/);
  assert.match(detail, /\.catch\(\(\) => \{ if \(alive\) setProduct\(null\); \}\)/);
});

test("persisted favorites are checked against the public catalog before display", () => {
  const favorites = source("src/pages/FavoritesPage.jsx");
  assert.match(favorites, /Promise\.allSettled\(favorites\.map\(\(product\) => api\.get/);
  assert.match(favorites, /result\.reason\?\.response\?\.status !== 404/);
  assert.match(favorites, /publicFavorites\.map\(\(p, i\)/);
  assert.doesNotMatch(favorites, /\{favorites\.map\(\(p, i\)/);
});

test("cart refuses checkout with previously saved unpublished products", () => {
  const cart = source("src/pages/CartPage.jsx");
  assert.match(cart, /Promise\.allSettled\(ids\.map\(id => api\.get/);
  assert.match(cart, /blocked\[ids\[index\]\] = true/);
  assert.match(cart, /No disponible en la tienda · eliminar del carrito/);
  assert.match(cart, /disabled=\{checkingPublication \|\| publicationCheckFailed \|\| Object\.keys\(blockedProductIds\)\.length > 0\}/);
});
