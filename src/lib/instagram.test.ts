import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createInstagram } from "./instagram";

describe("Instagram", () => {
  it("monta o link do perfil a partir do usuário, do @ e da URL", () => {
    assert.deepEqual(createInstagram("estudio.lina"), {
      ok: true,
      username: "estudio.lina",
      url: "https://www.instagram.com/estudio.lina/",
    });
    assert.deepEqual(createInstagram("@estudio.lina"), {
      ok: true,
      username: "estudio.lina",
      url: "https://www.instagram.com/estudio.lina/",
    });
    const pasted = createInstagram(
      "https://www.instagram.com/estudio.lina/?hl=pt-br",
    );
    assert.equal(pasted.ok && pasted.url, "https://www.instagram.com/estudio.lina/");
  });

  it("recusa usuário vazio e caractere inválido", () => {
    const empty = createInstagram("  ");
    assert.equal(empty.ok, false);
    if (!empty.ok) assert.equal(empty.missing, true);
    const invalid = createInstagram("ana silva");
    assert.equal(invalid.ok, false);
  });
});
