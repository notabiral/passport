import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative base: the same build must work served from the /passport/
  // GitHub Pages subpath and from a domain root.
  base: "./",
  build: { outDir: "dist" },
});
