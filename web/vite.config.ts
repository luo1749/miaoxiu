import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  // 在 Windows 某些环境下 Node 进程复制图片会被系统拦截，可通过 SKIP_PUBLIC_COPY=true 跳过，
  // 构建完成后再用 Python 脚本复制 public 资源
  publicDir: process.env.SKIP_PUBLIC_COPY === "true" ? false : "public",
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
