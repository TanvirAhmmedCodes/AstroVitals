import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  // Check custom backend port or default to 8080 (also falls back to 8000 if 8080 not ready)
  const targetPort = process.env.VITE_BACKEND_PORT || '8080';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: isDev
        ? {
            '/api': {
              target: `http://localhost:${targetPort}`,
              changeOrigin: true,
              secure: false,
            },
          }
        : {},
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  };
});
