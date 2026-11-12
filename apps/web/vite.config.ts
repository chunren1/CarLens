import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  // 本地开发用 /；服务器子路径部署时用 VITE_BASE=/wangshu/ 构建。
  base: process.env.VITE_BASE ?? "/",
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:3100",
    },
  },
  build: {
    target: "es2022",
  },
});
