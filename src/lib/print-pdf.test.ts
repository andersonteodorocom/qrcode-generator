import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderPrintSheet } from "./print-pdf";
import { buildPrintSheet } from "./print-sheet";

describe("PDF da folha", () => {
  it("cabe em uma página A4 e não escreve a senha do Wi-Fi", async () => {
    const sheet = buildPrintSheet({
      selected: ["pix", "instagram", "wifi"],
      shopName: "Padaria Luz",
      pix: { ok: true, payload: "00020126580014br.gov.bcb.pix", displayKey: "529.982.247-25" },
      instagram: { ok: true, url: "https://www.instagram.com/estudio.lina/", username: "estudio.lina" },
      wifi: {
        ok: true,
        payload: "WIFI:T:WPA;S:Casa;P:senha-secreta;;",
        ssid: "Casa da Maria",
        password: "senha-secreta",
      },
    });
    assert.ok(sheet);
    const doc = await renderPrintSheet(sheet);
    assert.equal(doc.getNumberOfPages(), 1);
    assert.ok(Math.abs(doc.internal.pageSize.getWidth() - 210) < 0.01);
    assert.ok(Math.abs(doc.internal.pageSize.getHeight() - 297) < 0.01);
    const raw = doc.output();
    assert.match(raw, /Central de QR Codes/);
    assert.equal(raw.includes("senha-secreta"), false);
    assert.match(raw, /Casa da Maria/);
  });
});
