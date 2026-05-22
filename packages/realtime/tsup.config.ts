import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  noExternal: [/@repo\//], // bundle workspace deps so the CJS is self-contained
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
