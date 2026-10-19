import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createWifi } from "./wifi";

describe("Wi-Fi", () => {
  it("monta o código lido pela câmera, com senha escapada", () => {
    const wifi = createWifi({
      ssid: "Casa:1",
      password: "seg;ura1",
      security: "WPA",
      hidden: false,
    });
    assert.equal(wifi.ok, true);
    if (!wifi.ok) return;
    assert.equal(wifi.payload, "WIFI:T:WPA;S:Casa\\:1;P:seg\\;ura1;;");
  });

  it("omite a senha em rede aberta e marca rede oculta", () => {
    const wifi = createWifi({
      ssid: "Visitas",
      password: "",
      security: "nopass",
      hidden: true,
    });
    assert.equal(wifi.ok, true);
    if (!wifi.ok) return;
    assert.equal(wifi.payload, "WIFI:T:nopass;S:Visitas;H:true;;");
  });

  it("exige 8 caracteres na senha WPA", () => {
    const wifi = createWifi({
      ssid: "Casa",
      password: "curta",
      security: "WPA",
      hidden: false,
    });
    assert.equal(wifi.ok, false);
    if (wifi.ok) return;
    assert.match(wifi.errors.password ?? "", /8 caracteres/);
  });
});
