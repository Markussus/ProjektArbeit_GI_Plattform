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

export default defineConfig({
  base: normalizeDeploymentBaseUrl(DEPLOYMENT_BASE_URL),
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ["java-parser"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    include: ["tests/unit_tests/**/*.test.{ts,tsx}"],
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
  },
});
