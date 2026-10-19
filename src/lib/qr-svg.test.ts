import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildStaticPixPayload } from "./pix";
import { renderQrSvg } from "./qr-svg";

describe("QR SVG", () => {
  it("desenha o exemplo oficial do Pix", () => {
    const payload = buildStaticPixPayload({
      key: "123e4567-e12b-12d1-a456-426655440000",
      name: "Fulano de Tal",
      city: "BRASILIA",
    });
    const svg = renderQrSvg(payload);
    assert.ok(svg);
    assert.match(svg ?? "", /^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
    assert.match(svg ?? "", /viewBox="/);
  });
});
