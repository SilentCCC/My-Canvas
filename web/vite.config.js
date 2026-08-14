import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
function readCanvasPort() {
  try {
    const candidate = Number(JSON.parse(readFileSync(path.resolve(root, "..", "settings.json"), "utf8")).port);
    return Number.isInteger(candidate) && candidate > 0 && candidate <= 65535 ? candidate : 8080;
  } catch { return 8080; }
}
const canvasPort = readCanvasPort();

export default defineConfig({
  root,
  plugins: [react()],
  build: {
    outDir: path.resolve(root, "dist"),
    emptyOutDir: true
  },
  server: {
    port: 5173,
    proxy: { "/api": `http://localhost:${canvasPort}` }
  }
});
