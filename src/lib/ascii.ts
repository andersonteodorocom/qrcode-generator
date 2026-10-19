/** Remove acentos e caracteres fora do ASCII imprimível. */
export function foldAscii(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function filenamePart(value: string): string {
  const folded = foldAscii(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return folded.slice(0, 40) || "qr";
}
