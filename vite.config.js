import { defineConfig } from "vite";
import process from "node:process";
import react from "@vitejs/plugin-react";
import cesium from "vite-plugin-cesium";

export default defineConfig({
  plugins: [
    react(),
    cesium(),
  ],
  server: {
    proxy: {
      "/api": process.env.VITE_API_PROXY || "http://localhost:3001",
    },
  },
});
