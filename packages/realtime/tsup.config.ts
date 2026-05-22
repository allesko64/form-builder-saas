import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  dts: {
    compilerOptions: {
      module: "ESNext",
      moduleResolution: "Bundler",
    },
  },
  outDir: "dist",
  clean: true,
  outExtension() {
    return { js: ".cjs" };
  },
});
