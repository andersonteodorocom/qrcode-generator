import core from "qrcode/lib/core/qrcode";
import svg from "qrcode/lib/renderer/svg-tag";

const INK = "#16130f";

export function renderQrSvg(text: string): string | null {
  try {
    const symbol = core.create(text, { errorCorrectionLevel: "H" });
    const markup = svg.render(symbol, {
      margin: 4,
      color: { dark: INK, light: "#ffffff" },
    });
    if (!markup.startsWith("<svg")) return null;
    return markup;
  } catch {
    return null;
  }
}
