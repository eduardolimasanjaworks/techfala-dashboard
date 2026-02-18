import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Em produção, remove console.* do bundle do cliente para não expor nada no DevTools
  compiler: {
    ...(process.env.NODE_ENV === "production" && {
      removeConsole: {
        exclude: [], // remove log, info, debug, warn, error no cliente
      },
    }),
  },
};

export default nextConfig;
