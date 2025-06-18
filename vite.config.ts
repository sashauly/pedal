import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables based on the current mode (e.g., 'development', 'production')
  // By default, `loadEnv` will load .env files
  const env = loadEnv(mode, process.cwd(), "");

  // Get the base path from an environment variable, defaulting to '/'
  // Ensure your CI/CD sets VITE_BASE_URL to '/<REPO>/'
  const BASE_URL = env.VITE_BASE_URL || "/";
  return {
    base: BASE_URL,
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,webp}"],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "openstreetmap-tiles",
                expiration: {
                  maxEntries: 1000,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
                // cacheKeyWillBeUsed: async ({ request }) => {
                //   return `${request.url}`;
                // }
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
        },
        includeAssets: [
          "favicon.ico",
          "apple-touch-icon-180x180.png",
          "bicycle.svg",
        ],
        manifest: {
          name: "Педаль Велосипедиста",
          short_name: "Педаль",
          description: "Приложение для отслеживания велосипедных маршрутов",
          start_url: BASE_URL,
          theme_color: "#3B82F6",
          background_color: "#1F2937",
          display: "standalone",
          orientation: "portrait",
          display_override: [
            "window-controls-overlay",
            "standalone",
            "browser",
          ],
          lang: "ru",
          icons: [
            {
              src: "pwa-64x64.png",
              sizes: "64x64",
              type: "image/png",
            },
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "maskable-icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    optimizeDeps: {
      exclude: ["lucide-react"],
    },
  };
});
