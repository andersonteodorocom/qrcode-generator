"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { createInstagram } from "@/lib/instagram";
import { createPix } from "@/lib/pix";
import { downloadPrintSheet, printPrintSheet } from "@/lib/print-pdf";
import { buildPrintSheet, type SheetKind } from "@/lib/print-sheet";
import { createWifi } from "@/lib/wifi";

const OPTIONS: { id: SheetKind; label: string }[] = [
  { id: "pix", label: "Pix" },
  { id: "instagram", label: "Instagram" },
  { id: "wifi", label: "Wi-Fi" },
];

export function PrintSheetPanel({
  shopName,
  pix,
  instagram,
  wifi,
}: {
  shopName: string;
  pix: ReturnType<typeof createPix>;
  instagram: ReturnType<typeof createInstagram>;
  wifi: ReturnType<typeof createWifi>;
}) {
  const [selected, setSelected] = useState<SheetKind[]>(["pix", "instagram", "wifi"]);
  const [busy, setBusy] = useState<"download" | "print" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sheet = useMemo(
    () =>
      buildPrintSheet({
        selected,
        shopName,
        pix: pix.ok ? { ok: true, payload: pix.payload, displayKey: pix.displayKey } : { ok: false },
        instagram: instagram.ok
          ? { ok: true, url: instagram.url, username: instagram.username }
          : { ok: false },
        wifi: wifi.ok
          ? { ok: true, payload: wifi.payload, ssid: wifi.ssid, password: wifi.password }
          : { ok: false },
      }),
    [instagram, pix, selected, shopName, wifi],
  );

  function toggle(kind: SheetKind) {
    setSelected((current) =>
      current.includes(kind) ? current.filter((item) => item !== kind) : [...current, kind],
    );
  }

  async function run(action: "download" | "print") {
    if (!sheet) return;
    setBusy(action);
    setError(null);
    try {
      if (action === "download") await downloadPrintSheet(sheet);
      else await printPrintSheet(sheet);
    } catch {
      setError("Não foi possível gerar a folha. Tente de novo.");
    } finally {
      setBusy(null);
    }
  }

  const summary =
    sheet?.count === 1
      ? "Um QR grande, centralizado na folha."
      : sheet?.count === 2
        ? "Dois cartões na mesma folha."
        : sheet?.count === 3
          ? "Central de QR Codes, com os três na mesma folha."
          : "Marque pelo menos um código já preenchido.";

  return (
    <section className="no-print mt-8 grid gap-4 rounded-[1.75rem] border border-border bg-card/80 p-5 sm:p-6">
      <div className="grid gap-2">
        <h2 className="font-display text-2xl tracking-tight">Folha para a impressora de casa</h2>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">
          A4 em pé, para o balcão ou a vitrine. Escolha um, dois ou os três. A senha do Wi-Fi entra
          no QR e não é escrita na folha.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {OPTIONS.map((option) => (
          <label key={option.id} className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-foreground"
              checked={selected.includes(option.id)}
              onChange={() => toggle(option.id)}
            />
            {option.label}
          </label>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{summary}</p>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          className="h-11 rounded-xl"
          disabled={!sheet || busy !== null}
          onClick={() => run("download")}
        >
          {busy === "download" ? "Gerando…" : "Baixar PDF"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-xl bg-card"
          disabled={!sheet || busy !== null}
          onClick={() => run("print")}
        >
          {busy === "print" ? "Abrindo…" : "Imprimir folha"}
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </section>
  );
}
