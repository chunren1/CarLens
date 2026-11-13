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
    // three-core 原文件约 583 KB（gzip 145 KB），只在 3D 模式加载；
    // 500 KB 的默认告警对 three 不合适，但仍保留 manualChunks 拆分与按需加载。
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 3D 依赖只在配置器 3D 模式下动态加载；拆成核心/扩展两块，
          // 避免 Configurator3D 一个 chunk 同时装下 three 与后处理。
          if (id.includes("node_modules/three")) {
            return id.includes("/examples/") || id.includes("/addons/") ? "three-addons" : "three-core";
          }
          if (id.includes("basis_transcoder")) return "basis-transcoder";
          return undefined;
        },
      },
    },
  },
});
