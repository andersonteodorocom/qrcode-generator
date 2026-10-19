import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { filenamePart } from "./ascii";
import { A4, type PrintSheet, type SheetBlock } from "./print-sheet";

async function qrImage(payload: string, sizeMm: number): Promise<string> {
  const px = Math.round(sizeMm * 12);
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "H",
    margin: 4,
    width: px,
    color: { dark: "#000000", light: "#ffffff" },
  });
}

function drawCentered(doc: jsPDF, text: string, x: number, y: number, width: number) {
  doc.text(text, x + width / 2, y, { align: "center", maxWidth: width - 8 });
}

function drawCard(
  doc: jsPDF,
  box: { x: number; y: number; w: number; h: number },
  block: SheetBlock,
  image: string,
  qrSize: number,
  shopName: string | null,
) {
  doc.setDrawColor(22, 19, 15);
  doc.setLineWidth(0.4);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(box.x, box.y, box.w, box.h, 3, 3, "FD");

  doc.setTextColor(22, 19, 15);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(shopName ? 16 : 18);
  drawCentered(doc, block.title, box.x, box.y + 10, box.w);

  const qrX = box.x + (box.w - qrSize) / 2;
  const qrY = box.y + (shopName ? 16 : 14);
  doc.addImage(image, "PNG", qrX, qrY, qrSize, qrSize);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  drawCentered(doc, block.value, box.x, qrY + qrSize + 7, box.w);

  if (shopName) {
    doc.setFontSize(10);
    doc.setTextColor(70, 64, 58);
    drawCentered(doc, shopName, box.x, qrY + qrSize + 13, box.w);
  }
}

export async function renderPrintSheet(sheet: PrintSheet): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, A4.width, A4.height, "F");

  const images = await Promise.all(
    sheet.blocks.map((block) => qrImage(block.payload, sheet.geometry.qrSizeMm)),
  );

  if (sheet.geometry.header && sheet.header) {
    const header = sheet.geometry.header;
    doc.setTextColor(22, 19, 15);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    drawCentered(doc, sheet.header, header.x, header.y + 8, header.w);
    if (sheet.shopName) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      drawCentered(doc, sheet.shopName, header.x, header.y + 16, header.w);
    }
  }

  sheet.blocks.forEach((block, index) => {
    const card = sheet.geometry.cards[index];
    if (!card) return;
    const shopOnCard = sheet.count === 3 ? null : sheet.shopName;
    drawCard(doc, card, block, images[index], sheet.geometry.qrSizeMm, shopOnCard);
  });

  return doc;
}

function fileName(sheet: PrintSheet): string {
  if (sheet.count === 3) return "definitivo-central-qr.pdf";
  const parts = sheet.blocks.map((block) => filenamePart(block.kind)).join("-");
  return `definitivo-folha-${parts}.pdf`;
}

export async function downloadPrintSheet(sheet: PrintSheet) {
  const doc = await renderPrintSheet(sheet);
  doc.save(fileName(sheet));
}

export async function printPrintSheet(sheet: PrintSheet) {
  const doc = await renderPrintSheet(sheet);
  doc.autoPrint();
  const url = doc.output("bloburl");
  const opened = window.open(url);
  if (!opened) doc.save(fileName(sheet));
}
