// Logger simples para o servidor
export const serverLogger = {
  error: (message: string, error: any, context?: any) => {
    console.error(`[ERROR] ${message}`, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      ...context,
    });
  },
  warn: (message: string, context?: any) => {
    console.warn(`[WARN] ${message}`, context);
  },
  info: (message: string, context?: any) => {
    console.log(`[INFO] ${message}`, context);
  },
};
