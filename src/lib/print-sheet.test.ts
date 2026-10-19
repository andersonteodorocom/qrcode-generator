import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { A4, buildPrintSheet, printGeometry, type SheetKind } from "./print-sheet";

const ready = {
  pix: { ok: true, payload: "000201", displayKey: "529.982.247-25" },
  instagram: { ok: true, url: "https://www.instagram.com/estudio.lina/", username: "estudio.lina" },
  wifi: {
    ok: true,
    payload: "WIFI:T:WPA;S:Casa;P:senha-secreta;;",
    ssid: "Casa da Maria",
    password: "senha-secreta",
  },
};

function sheet(selected: SheetKind[]) {
  return buildPrintSheet({ selected, shopName: "Padaria Luz", ...ready });
}

describe("folha A4", () => {
  it("monta 1, 2 ou 3 códigos e omite o que não está pronto", () => {
    const one = sheet(["pix"]);
    assert.ok(one);
    assert.equal(one.count, 1);
    assert.equal(one.header, null);
    assert.equal(one.blocks[0]?.title, "Pague com Pix");
    assert.equal(one.geometry.qrSizeMm, 120);

    const two = sheet(["wifi", "instagram"]);
    assert.ok(two);
    assert.equal(two.count, 2);
    assert.deepEqual(
      two.blocks.map((block) => block.kind),
      ["instagram", "wifi"],
    );
    assert.equal(two.geometry.qrSizeMm, 88);

    const three = sheet(["pix", "instagram", "wifi"]);
    assert.ok(three);
    assert.equal(three.count, 3);
    assert.equal(three.header, "Central de QR Codes");
    assert.equal(three.shopName, "Padaria Luz");
    assert.ok(three.geometry.qrSizeMm < one.geometry.qrSizeMm);
    assert.equal(three.blocks[2]?.value, "Casa da Maria");
    assert.equal(three.blocks[2]?.value.includes("senha-secreta"), false);
  });

  it("não imprime caixa vazia quando o código marcado é inválido", () => {
    const onlyWifi = buildPrintSheet({
      selected: ["pix", "wifi"],
      shopName: "  ",
      pix: { ok: false },
      instagram: { ok: false },
      wifi: ready.wifi,
    });
    assert.ok(onlyWifi);
    assert.equal(onlyWifi.count, 1);
    assert.equal(onlyWifi.blocks[0]?.kind, "wifi");
    assert.equal(onlyWifi.shopName, null);
    assert.equal(buildPrintSheet({ selected: ["pix"], shopName: "", pix: { ok: false }, instagram: { ok: false }, wifi: { ok: false } }), null);
  });

  it("cabe numa A4 com margem de 12 mm", () => {
    for (const count of [1, 2, 3] as const) {
      const geometry = printGeometry(count);
      const boxes = geometry.header ? [geometry.header, ...geometry.cards] : geometry.cards;
      assert.equal(geometry.cards.length, count);
      for (const box of boxes) {
        assert.ok(box.x >= A4.margin - 0.01);
        assert.ok(box.y >= A4.margin - 0.01);
        assert.ok(box.x + box.w <= A4.width - A4.margin + 0.01);
        assert.ok(box.y + box.h <= A4.height - A4.margin + 0.01);
      }
      for (const card of geometry.cards) {
        assert.ok(card.h > geometry.qrSizeMm);
      }
    }
  });
});
