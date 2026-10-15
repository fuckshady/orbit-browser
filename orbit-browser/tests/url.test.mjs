import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveInput } from "../electron/browser/url.ts";
test("navega dominios y conserva URLs", () => {
  assert.equal(resolveInput("github.com"), "https://github.com/");
  assert.equal(
    resolveInput("https://example.com/a?q=x"),
    "https://example.com/a?q=x",
  );
  assert.equal(resolveInput("localhost:8080/a"), "http://localhost:8080/a");
});
test("codifica búsquedas y selecciona motor", () => {
  assert.equal(
    resolveInput("espacio & tierra", "DuckDuckGo"),
    "https://duckduckgo.com/?q=espacio%20%26%20tierra",
  );
  assert.equal(
    resolveInput("una búsqueda", "Bing"),
    "https://www.bing.com/search?q=una%20b%C3%BAsqueda",
  );
});
test("bloquea esquemas privilegiados y entradas inválidas", () => {
  for (const v of [
    "javascript:alert(1)",
    "file:///etc/passwd",
    "data:text/html,hello",
    "mailto:a@b.com",
    "",
    "x".repeat(8200),
  ])
    assert.throws(() => resolveInput(v));
});
