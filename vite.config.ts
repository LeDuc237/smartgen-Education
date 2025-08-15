import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import history from 'connect-history-api-fallback';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'vite-single-page-app',
      configureServer(server) {
        const historyMiddleware = history({
          rewrites: [
            {
              from: /\/.*/,
              to: ({ parsedUrl }: any) => {
                // Exclude Vite internal requests
                if (parsedUrl.pathname.startsWith('/@')) return parsedUrl.pathname;
                if (parsedUrl.pathname.startsWith('/node_modules')) return parsedUrl.pathname;
                return parsedUrl.pathname.includes('.') ? parsedUrl.pathname : '/index.html';
              }
            }
          ]
        });

        // Return middleware in correct format
        return () => {
          server.middlewares.use((req, res, next) => {
            historyMiddleware(req, res, next);
          });
        };
      }
    }
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    hmr: {
      overlay: false
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
});