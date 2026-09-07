/// <reference types="vitest/config" />
import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import compression from "compression";
import { defineConfig, type Connect, type Plugin } from "vite";

const VENDOR_PACKAGES = ["react-dom", "react-router-dom", "/react/"];
const UI_PACKAGES = ["motion", "lucide-react"];

function getChunkForModule(id: string): string | undefined {
  if (!id.includes("node_modules")) return undefined;
  if (VENDOR_PACKAGES.some((pkg) => id.includes(pkg))) return "vendor";
  if (UI_PACKAGES.some((pkg) => id.includes(pkg))) return "ui";
  return undefined;
}

function previewCompressionPlugin(): Plugin {
  return {
    name: "preview-compression",
    configurePreviewServer(server) {
      server.middlewares.use(
        compression() as unknown as Connect.NextHandleFunction,
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), previewCompressionPlugin()],
  optimizeDeps: {
    include: ["java-parser"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    include: ["tests/unit_tests/**/*.test.{ts,tsx}"],
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts", "src/main.tsx"],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          return getChunkForModule(id);
        },
      },
    },
  },
});
