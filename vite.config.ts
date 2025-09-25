import { defineConfig, UserConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vuetify from 'vite-plugin-vuetify'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(async (): Promise<UserConfig> => {

  const host = process.env.TAURI_DEV_HOST;

  return {
    plugins: [
      vue(),
      vueDevTools(),
      vuetify({ autoImport: { labs: true } })
    ],

    worker: {
      format: 'es',
    },

    resolve: {
      alias: {
        '@': `${__dirname}/src`
      }
    },

    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    // 1. prevent Vite from obscuring rust errors
    clearScreen: false,
    // 2. tauri expects a fixed port, fail if that port is not available
    server: {
      port: 1420,
      strictPort: true,
      host: host || false,
      hmr: host
        ? {
          protocol: "ws",
          host,
          port: 1421,
        }
        : undefined,
      watch: {
        // 3. tell Vite to ignore watching `src-tauri`
        ignored: ["**/src-tauri/**"],
      },
    },
  }
});