// Logger simples para o cliente
export const clientError = (message: string, error?: any, context?: any) => {
  console.error(`[CLIENT ERROR] ${message}`, {
    error: error instanceof Error ? error.message : error,
    ...context,
  });
  
  // Opcionalmente, enviar para o servidor
  if (typeof window !== 'undefined') {
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 'error',
        message,
        error: error instanceof Error ? error.message : String(error),
        context,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {
      // Ignorar erros ao enviar log
    });
  }
};
