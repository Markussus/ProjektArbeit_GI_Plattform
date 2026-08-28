/// <reference types="vitest/config" />
import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { DEPLOYMENT_BASE_URL } from "./deployment.config";

function normalizeDeploymentBaseUrl(value: string) {
  const base = value.trim();

  if (!base) {
    return "/";
  }

  if (base === "./") {
    throw new Error(
      'DEPLOYMENT_BASE_URL="./" is not supported with BrowserRouter. Use "/", a subpath such as "/gi_learningtool/", or a full URL.',
    );
  }

  if (/^https?:\/\//i.test(base)) {
    return base.endsWith("/") ? base : `${base}/`;
  }

  const absolutePath = base.startsWith("/") ? base : `/${base}`;
  return absolutePath.endsWith("/") ? absolutePath : `${absolutePath}/`;
}

const VENDOR_PACKAGES = ["react-dom", "react-router-dom", "/react/"];
const UI_PACKAGES = ["motion", "lucide-react"];

function getChunkForModule(id: string): string | undefined {
  if (!id.includes("node_modules")) return undefined;
  if (VENDOR_PACKAGES.some((pkg) => id.includes(pkg))) return "vendor";
  if (UI_PACKAGES.some((pkg) => id.includes(pkg))) return "ui";
  return undefined;
}

export default defineConfig({
  base: normalizeDeploymentBaseUrl(DEPLOYMENT_BASE_URL),
  plugins: [react(), tailwindcss()],
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
