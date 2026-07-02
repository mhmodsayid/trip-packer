import type { ErrorKey } from "./i18n";

export class AppError extends Error {
  readonly code: ErrorKey;

  constructor(code: ErrorKey) {
    super(code);
    this.code = code;
    this.name = "AppError";
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

export function errorCode(err: unknown): ErrorKey | null {
  return isAppError(err) ? err.code : null;
}

export function formatError(
  err: unknown,
  te: (code: ErrorKey) => string,
  fallback: ErrorKey
): string {
  const code = errorCode(err);
  return code ? te(code) : te(fallback);
}
