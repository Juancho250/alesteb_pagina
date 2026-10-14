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
