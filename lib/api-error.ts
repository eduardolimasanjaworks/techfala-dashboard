/**
 * Em desenvolvimento, retorna a mensagem real do erro para facilitar debug.
 * Em produção, retorna apenas uma mensagem genérica.
 */
export function getClientErrorMessage(
  fallback: string,
  error: unknown
): { error: string; debug?: string } {
  const isDev = process.env.NODE_ENV !== 'production';
  const message =
    error instanceof Error ? error.message : error != null ? String(error) : fallback;
  if (isDev) {
    return { error: fallback, debug: message };
  }
  return { error: fallback };
}
