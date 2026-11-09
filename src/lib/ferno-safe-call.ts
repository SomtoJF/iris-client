export function safelyCall(
  analytics: object | undefined,
  method: string,
  ...args: unknown[]
): void {
  const fn = (analytics as Record<string, unknown> | undefined)?.[method];
  if (typeof fn !== "function") return;

  try {
    const callable = fn as (...args: unknown[]) => unknown;
    void Promise.resolve(callable.apply(analytics, args)).catch(() => undefined);
  } catch {
    // Analytics must never interrupt the user workflow.
  }
}
