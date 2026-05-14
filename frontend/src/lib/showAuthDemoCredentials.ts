/**
 * Test-account quick-fill on /auth/login is hidden from public users.
 * Set NEXT_PUBLIC_SHOW_AUTH_DEMO_CREDENTIALS=true in .env.local for operators only.
 */
export function showAuthDemoCredentials(): boolean {
  return process.env.NEXT_PUBLIC_SHOW_AUTH_DEMO_CREDENTIALS === "true";
}
