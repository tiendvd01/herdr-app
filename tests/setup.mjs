// Loaded with --import: lib files import the app's "herdr" module, which only exists inside Herdr.
import { registerHooks } from "node:module";

const stub = new URL("./herdr-stub.mjs", import.meta.url).href;
registerHooks({
  resolve: (spec, ctx, next) => (spec === "herdr" ? { url: stub, shortCircuit: true } : next(spec, ctx)),
});
