export const A4 = { width: 210, height: 297, margin: 12 } as const;

export type SheetKind = "pix" | "instagram" | "wifi" | "site";

export type SheetCount = 1 | 2 | 3 | 4;

export type SheetBlock = {
  kind: SheetKind;
  title: string;
  value: string;
  payload: string;
};

export type CardBox = { x: number; y: number; w: number; h: number };

export type PrintGeometry = {
  qrSizeMm: number;
  header: CardBox | null;
  cards: CardBox[];
};

export type PrintSheet = {
  count: SheetCount;
  header: string | null;
  shopName: string | null;
  blocks: SheetBlock[];
  geometry: PrintGeometry;
};

const TITLES: Record<SheetKind, string> = {
  pix: "Pague com Pix",
  instagram: "Siga no Instagram",
  wifi: "Wi-Fi para clientes",
  site: "Acesse o site",
};

const ORDER: SheetKind[] = ["pix", "instagram", "wifi", "site"];

const DISPLAY_LIMIT: Record<SheetCount, number> = { 1: 72, 2: 56, 3: 48, 4: 36 };

export function truncateSheetText(value: string, max: number): string {
  if (value.length <= max) return value;
  if (max <= 3) return value.slice(0, max);
  return `${value.slice(0, max - 3)}...`;
}

export function printGeometry(count: SheetCount): PrintGeometry {
  const { width, height, margin } = A4;
  const innerW = width - margin * 2;
  const innerH = height - margin * 2;

  if (count === 1) {
    const w = 168;
    const h = 230;
    return {
      qrSizeMm: 120,
      header: null,
      cards: [
        {
          x: margin + (innerW - w) / 2,
          y: margin + (innerH - h) / 2,
          w,
          h,
        },
      ],
    };
  }

  if (count === 2) {
    const gap = 8;
    const h = (innerH - gap) / 2;
    return {
      qrSizeMm: 88,
      header: null,
      cards: [0, 1].map((index) => ({
        x: margin,
        y: margin + index * (h + gap),
        w: innerW,
        h,
      })),
    };
  }

  if (count === 3) {
    const headerH = 22;
    const gap = 5;
    const h = (innerH - headerH - gap * 3) / 3;
    return {
      qrSizeMm: 50,
      header: { x: margin, y: margin, w: innerW, h: headerH },
      cards: [0, 1, 2].map((index) => ({
        x: margin,
        y: margin + headerH + gap + index * (h + gap),
        w: innerW,
        h,
      })),
    };
  }

  const headerH = 18;
  const gap = 6;
  const cardW = (innerW - gap) / 2;
  const cardH = 102;
  const blockH = headerH + gap + cardH * 2 + gap;
  const top = margin + (innerH - blockH) / 2;
  return {
    qrSizeMm: 64,
    header: { x: margin, y: top, w: innerW, h: headerH },
    cards: [0, 1, 2, 3].map((index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      return {
        x: margin + col * (cardW + gap),
        y: top + headerH + gap + row * (cardH + gap),
        w: cardW,
        h: cardH,
      };
    }),
  };
}

export function buildPrintSheet(input: {
  selected: Iterable<SheetKind>;
  shopName: string;
  pix: { ok: boolean; payload?: string; displayKey?: string };
  instagram: { ok: boolean; url?: string; username?: string };
  wifi: { ok: boolean; payload?: string; ssid?: string; password?: string };
  site?: { ok: boolean; url?: string };
}): PrintSheet | null {
  const selected = new Set(input.selected);
  const blocks: SheetBlock[] = [];

  for (const kind of ORDER) {
    if (!selected.has(kind)) continue;
    if (kind === "pix" && input.pix.ok && input.pix.payload && input.pix.displayKey) {
      blocks.push({
        kind,
        title: TITLES.pix,
        value: input.pix.displayKey,
        payload: input.pix.payload,
      });
    }
    if (kind === "instagram" && input.instagram.ok && input.instagram.url && input.instagram.username) {
      blocks.push({
        kind,
        title: TITLES.instagram,
        value: `@${input.instagram.username}`,
        payload: input.instagram.url,
      });
    }
    if (kind === "wifi" && input.wifi.ok && input.wifi.payload && input.wifi.ssid) {
      blocks.push({
        kind,
        title: TITLES.wifi,
        value: input.wifi.ssid,
        payload: input.wifi.payload,
      });
    }
    if (kind === "site" && input.site?.ok && input.site.url) {
      blocks.push({
        kind,
        title: TITLES.site,
        value: input.site.url,
        payload: input.site.url,
      });
    }
  }

  if (blocks.length === 0 || blocks.length > 4) return null;
  const count = blocks.length as SheetCount;
  const shopName = input.shopName.trim() || null;
  for (const block of blocks) {
    if (block.kind === "site") block.value = truncateSheetText(block.value, DISPLAY_LIMIT[count]);
  }
  return {
    count,
    header: count >= 3 ? "Central de QR Codes" : null,
    shopName,
    blocks,
    geometry: printGeometry(count),
  };
}
