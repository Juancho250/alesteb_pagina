export const normalizePrice = (val) => {
  if (!val) return 0;
  if (typeof val === "number") return val;
  return Number(val.toString().replace(/[^\d]/g, "")) || 0;
};
