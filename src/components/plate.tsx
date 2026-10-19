"use client";

import { useState } from "react";
import { Check, Copy, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { renderQrSvg } from "@/lib/qr-svg";
import { cn } from "@/lib/utils";

export type PlateModel = {
  index: string;
  kicker: string;
  title: string;
  accent: "pix" | "instagram" | "wifi" | "site";
  lines: { label: string; value: string }[];
  technical: string | null;
  footnote: string;
  empty: string;
  alt: string;
  payload: string | null;
  payloadLabel: string;
  filename: string;
};

const accentBar = {
  pix: "bg-pix",
  instagram: "bg-instagram",
  wifi: "bg-wifi",
  site: "bg-site",
} as const;

const accentText = {
  pix: "text-pix",
  instagram: "text-instagram",
  wifi: "text-wifi",
  site: "text-site",
} as const;

function download(filename: string, href: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  link.click();
}

export function Plate({ model }: { model: PlateModel }) {
  const svg = model.payload ? renderQrSvg(model.payload) : null;
  const [notice, setNotice] = useState<string | null>(null);

  async function copyPayload() {
    if (!model.payload) return;
    try {
      await navigator.clipboard.writeText(model.payload);
      setNotice("Copiado");
    } catch {
      setNotice("Não foi possível copiar");
    }
    window.setTimeout(() => setNotice(null), 2000);
  }

  function downloadSvg() {
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    download(`${model.filename}.svg`, url);
    URL.revokeObjectURL(url);
  }

  async function downloadPng() {
    if (!model.payload) return;
    const qr = await import("qrcode/lib/browser");
    const toDataURL =
      qr.toDataURL ??
      (qr as { default?: { toDataURL?: typeof qr.toDataURL } }).default?.toDataURL;
    if (!toDataURL) {
      setNotice("Não foi possível gerar o PNG");
      window.setTimeout(() => setNotice(null), 2000);
      return;
    }
    const dataUrl = await toDataURL(model.payload, {
      errorCorrectionLevel: "H",
      margin: 4,
      width: 1600,
      color: { dark: "#16130f", light: "#ffffff" },
    });
    download(`${model.filename}.png`, dataUrl);
  }

  return (
    <article
      id="chapa"
      className="print-card scroll-mt-6 rounded-[1.75rem] border border-border bg-card p-5 shadow-[0_24px_60px_-36px_rgba(28,25,21,0.55)] sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-xl tracking-tight">Definitivo</p>
        <p className="font-mono text-[11px] tracking-[0.22em] text-muted-foreground">
          CARTÃO {model.index}
        </p>
      </div>
      <div className={cn("mt-4 h-1.5 rounded-full", accentBar[model.accent])} />
      <p
        className={cn(
          "mt-4 text-xs font-medium tracking-[0.16em] uppercase",
          accentText[model.accent],
        )}
      >
        {model.kicker}
      </p>
      <h2 className="font-display mt-1 text-3xl leading-tight tracking-tight text-balance">
        {model.title}
      </h2>

      <div className="mt-5 rounded-2xl border border-border bg-white p-3">
        {svg ? (
          <div
            role="img"
            aria-label={model.alt}
            className="qr-frame"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div className="flex aspect-square items-center justify-center px-6 text-center">
            <p className="max-w-56 text-sm leading-6 text-muted-foreground">
              {model.payload
                ? "Esse conteúdo não coube num QR. Encurte o texto."
                : model.empty}
            </p>
          </div>
        )}
      </div>

      {model.lines.length > 0 ? (
        <dl className="mt-5 grid gap-2">
          {model.lines.map((line) => (
            <div key={line.label} className="flex items-baseline justify-between gap-4">
              <dt className="text-sm text-muted-foreground">{line.label}</dt>
              <dd className="text-right text-sm font-medium break-all">{line.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {model.technical ? (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">{model.technical}</p>
      ) : null}
      <p className="mt-4 text-sm leading-6 text-muted-foreground">{model.footnote}</p>

      <div className="no-print mt-5 grid gap-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            className="h-11 rounded-xl"
            disabled={!svg}
            onClick={downloadPng}
          >
            <Download />
            PNG
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl bg-card"
            disabled={!svg}
            onClick={downloadSvg}
          >
            <Download />
            SVG
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl bg-card"
            disabled={!model.payload}
            onClick={copyPayload}
          >
            {notice === "Copiado" ? <Check /> : <Copy />}
            {notice === "Copiado" ? "Copiado" : "Copiar"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl bg-card"
            disabled={!svg}
            onClick={() => window.print()}
          >
            <Printer />
            Imprimir
          </Button>
        </div>
        {notice && notice !== "Copiado" ? (
          <p role="alert" className="text-sm text-destructive">
            {notice}
          </p>
        ) : null}
        {svg && model.payload ? (
          <details className="rounded-xl border border-border px-3 py-2">
            <summary className="cursor-pointer text-sm font-medium">
              {model.payloadLabel}
            </summary>
            <p className="mt-2 font-mono text-xs leading-5 break-all text-muted-foreground">
              {model.payload}
            </p>
          </details>
        ) : null}
      </div>
      <p className="sr-only" aria-live="polite">
        {svg ? "QR Code pronto para baixar ou imprimir." : "QR Code ainda incompleto."}
      </p>
    </article>
  );
}
