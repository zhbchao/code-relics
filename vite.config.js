import { defineConfig } from "vite";

export default defineConfig({
  base: "/code-relics/",
  build: {
    target: "es2022",
    sourcemap: true,
  },
});
