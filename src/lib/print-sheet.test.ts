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
  site: { ok: true, url: "https://loja.com.br" },
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
    assert.equal(
      buildPrintSheet({
        selected: ["pix"],
        shopName: "",
        pix: { ok: false },
        instagram: { ok: false },
        wifi: { ok: false },
        site: { ok: false },
      }),
      null,
    );
  });

  it("inclui o site sozinho, junto com outro código, ou os quatro", () => {
    const onlySite = sheet(["site"]);
    assert.ok(onlySite);
    assert.equal(onlySite.count, 1);
    assert.equal(onlySite.header, null);
    assert.equal(onlySite.blocks[0]?.title, "Acesse o site");
    assert.equal(onlySite.blocks[0]?.payload, "https://loja.com.br");
    assert.equal(onlySite.geometry.qrSizeMm, 120);

    const pair = sheet(["site", "pix"]);
    assert.ok(pair);
    assert.equal(pair.count, 2);
    assert.deepEqual(
      pair.blocks.map((block) => block.kind),
      ["pix", "site"],
    );

    const four = sheet(["wifi", "site", "pix", "instagram"]);
    assert.ok(four);
    assert.equal(four.count, 4);
    assert.equal(four.header, "Central de QR Codes");
    assert.equal(four.shopName, "Padaria Luz");
    assert.deepEqual(
      four.blocks.map((block) => block.kind),
      ["pix", "instagram", "wifi", "site"],
    );
    assert.equal(four.geometry.cards.length, 4);
    assert.ok(four.geometry.header);
    assert.ok(four.geometry.qrSizeMm >= 50);
    assert.ok(four.geometry.qrSizeMm < 88);
    const [first, second, third] = four.geometry.cards;
    assert.equal(first?.y, second?.y);
    assert.ok((first?.x ?? 0) < (second?.x ?? 0));
    assert.ok((first?.y ?? 0) < (third?.y ?? 0));

    const skipped = buildPrintSheet({
      selected: ["site", "pix"],
      shopName: "Padaria Luz",
      pix: ready.pix,
      instagram: { ok: false },
      wifi: { ok: false },
      site: { ok: false },
    });
    assert.ok(skipped);
    assert.equal(skipped.count, 1);
    assert.equal(skipped.blocks[0]?.kind, "pix");
  });

  it("encurta o endereço visível e mantém a URL inteira no QR", () => {
    const url = `https://loja.com.br/${"cardapio".repeat(12)}`;
    const printed = buildPrintSheet({
      selected: ["site"],
      shopName: "Padaria Luz",
      pix: { ok: false },
      instagram: { ok: false },
      wifi: { ok: false },
      site: { ok: true, url },
    });
    assert.ok(printed);
    assert.equal(printed.blocks[0]?.payload, url);
    assert.equal(printed.blocks[0]?.value.endsWith("..."), true);
    assert.ok(printed.blocks[0].value.length < url.length);
  });

  it("cabe numa A4 com margem de 12 mm", () => {
    for (const count of [1, 2, 3, 4] as const) {
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
