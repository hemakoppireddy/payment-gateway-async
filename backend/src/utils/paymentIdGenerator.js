const ALPHANUM =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function generatePaymentId() {
  let suffix = "";
  for (let i = 0; i < 16; i++) {
    suffix += ALPHANUM.charAt(
      Math.floor(Math.random() * ALPHANUM.length)
    );
  }
  return `pay_${suffix}`;
}
