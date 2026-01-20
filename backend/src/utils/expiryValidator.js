export function isValidExpiry(month, year) {
  const m = parseInt(month, 10);
  if (m < 1 || m > 12) return false;

  let y = parseInt(year, 10);
  if (year.length === 2) y += 2000;

  const now = new Date();
  const expiry = new Date(y, m);

  return expiry >= new Date(now.getFullYear(), now.getMonth());
}
