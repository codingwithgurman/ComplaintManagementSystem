export function isRequired(v) {
  return String(v || "").trim().length > 0;
}
export function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
}
export function isPhone(v) {
  return /^\d{10}$/.test(String(v || "").trim());
}
export function minLength(v, n) {
  return String(v || "").trim().length >= n;
}
export function passwordStrength(v) {
  let score = 0;
  const value = String(v || "");
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  return score; // 0-4
}
export function strengthLabel(score) {
  return ["Very weak", "Weak", "Fair", "Good", "Strong"][score] || "";
}
export function strengthColor(score) {
  return ["#B33A3A", "#B33A3A", "#C98D2E", "#2C6E8C", "#2E7D5B"][score] || "#B33A3A";
}
