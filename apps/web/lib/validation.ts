// Shared field validators with friendly messages.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(value: string): string | null {
  const v = value.trim();
  if (!v) return "Enter your email address.";
  if (!v.includes("@")) return "Email must include '@'.";
  if (!EMAIL_RE.test(v)) return "That doesn't look like a valid email.";
  return null;
}

export interface PasswordRule {
  label: string;
  ok: boolean;
}

/**
 * Returns a list of rule results. `passed = all ok`.
 * Used for inline strength indicator under the password field.
 */
export function checkPassword(value: string): {
  rules: PasswordRule[];
  passed: boolean;
} {
  const rules: PasswordRule[] = [
    { label: "At least 8 characters", ok: value.length >= 8 },
    { label: "One uppercase letter", ok: /[A-Z]/.test(value) },
    { label: "One number", ok: /\d/.test(value) },
  ];
  return { rules, passed: rules.every((r) => r.ok) };
}

/** Validator for the login form — we only check the password is non-empty. */
export function validateLoginPassword(value: string): string | null {
  if (!value) return "Enter your password.";
  return null;
}

/** Validator for the signup form — full strength check. */
export function validateSignupPassword(value: string): string | null {
  if (!value) return "Enter a password.";
  const { passed, rules } = checkPassword(value);
  if (passed) return null;
  const missing = rules.filter((r) => !r.ok).map((r) => r.label.toLowerCase());
  return `Password needs: ${missing.join(", ")}.`;
}

export function validateName(value: string): string | null {
  const v = value.trim();
  if (!v) return "Enter your full name.";
  if (v.length < 2) return "Name is too short.";
  return null;
}
