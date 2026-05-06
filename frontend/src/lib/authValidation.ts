/** RFC-style practical email check + Zod-like rules for UI hints */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  const s = value.trim();
  if (!s) return false;
  if (!EMAIL_RE.test(s)) return false;
  const [local, domain] = s.split("@");
  if (!local || !domain || !domain.includes(".")) return false;
  return true;
}

/** Password rules aligned with backend `strongPasswordSchema` */
export function getPasswordStrengthErrors(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 8) errors.push("At least 8 characters");
  if (!/[a-z]/.test(password)) errors.push("One lowercase letter");
  if (!/[A-Z]/.test(password)) errors.push("One uppercase letter");
  if (!/[0-9]/.test(password)) errors.push("One number");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("One special character (!@#$%…)");
  if (password.length > 128) errors.push("Maximum 128 characters");
  return errors;
}

export function isStrongPassword(password: string): boolean {
  return getPasswordStrengthErrors(password).length === 0;
}
