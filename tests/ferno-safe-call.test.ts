import assert from "node:assert/strict";
import test from "node:test";
import { safelyCall } from "../src/lib/ferno-safe-call.ts";

test("ignores missing analytics methods", () => {
  assert.doesNotThrow(() => safelyCall({}, "page", { path: "/" }));
});

test("does not let analytics throw synchronously", () => {
  assert.doesNotThrow(() =>
    safelyCall({ page: () => { throw new Error("sdk failure"); } }, "page"),
  );
});

test("does not create an unhandled rejection", async () => {
  safelyCall({ page: () => Promise.reject(new Error("sdk failure")) }, "page");
  await new Promise((resolve) => setImmediate(resolve));
});
