import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  dts: true,
  outDir: "dist",
  clean: true,
  outExtension() {
    return { js: ".js" };
  },
});
