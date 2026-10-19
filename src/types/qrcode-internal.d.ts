declare module "qrcode/lib/core/qrcode" {
  const core: {
    create: (
      data: string,
      options?: { errorCorrectionLevel?: "L" | "M" | "Q" | "H" },
    ) => unknown;
  };
  export default core;
}

declare module "qrcode/lib/renderer/svg-tag" {
  const svg: {
    render: (
      data: unknown,
      options?: {
        margin?: number;
        width?: number;
        color?: { dark?: string; light?: string };
      },
    ) => string;
  };
  export default svg;
}

declare module "qrcode/lib/browser" {
  export function toDataURL(
    text: string,
    options?: {
      errorCorrectionLevel?: "L" | "M" | "Q" | "H";
      margin?: number;
      width?: number;
      color?: { dark?: string; light?: string };
    },
  ): Promise<string>;
}
