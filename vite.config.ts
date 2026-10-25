import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 4174,
    strictPort: true,
    open: true,
    watch: {
      // Windows 下 npm 缓存与构建产物都在项目内，不必让热更新去监听它们。
      ignored: ["**/dist/**", "**/.npm-cache/**"],
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4174,
    strictPort: true,
    open: true,
  },
});
