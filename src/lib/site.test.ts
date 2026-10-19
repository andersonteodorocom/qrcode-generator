import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SITE_URL_MAX, createSite } from "./site";

describe("Site", () => {
  it("completa https quando o endereço vem sem esquema", () => {
    assert.deepEqual(createSite("loja.com.br"), { ok: true, url: "https://loja.com.br" });
    assert.deepEqual(createSite("  www.loja.com.br  "), {
      ok: true,
      url: "https://www.loja.com.br",
    });
    assert.deepEqual(createSite("loja.com.br/cardapio"), {
      ok: true,
      url: "https://loja.com.br/cardapio",
    });
  });

  it("mantém http quando a pessoa escreveu esse esquema", () => {
    assert.deepEqual(createSite("http://loja.com.br"), { ok: true, url: "http://loja.com.br" });
    assert.deepEqual(createSite("HTTP://loja.com.br/mapa"), {
      ok: true,
      url: "http://loja.com.br/mapa",
    });
    assert.deepEqual(createSite("https://loja.com.br"), { ok: true, url: "https://loja.com.br" });
  });

  it("recusa vazio, espaço e esquema que não é http", () => {
    const empty = createSite("   ");
    assert.equal(empty.ok, false);
    if (!empty.ok) assert.equal(empty.missing, true);

    const spaced = createSite("loja .com.br");
    assert.equal(spaced.ok, false);
    if (!spaced.ok) assert.match(spaced.error ?? "", /espaço/);

    for (const raw of ["javascript:alert(1)", "data:text/html,oi", "file:///C:/loja", "ftp://loja.com.br"]) {
      const result = createSite(raw);
      assert.equal(result.ok, false);
      if (!result.ok) assert.equal(result.missing, false);
    }
  });

  it("recusa endereço maior que 500 caracteres", () => {
    const raw = `https://loja.com.br/${"a".repeat(SITE_URL_MAX)}`;
    const result = createSite(raw);
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error ?? "", /500/);
  });
});
