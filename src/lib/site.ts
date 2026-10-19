export const SITE_URL_MAX = 500;

export type SiteResult =
  | { ok: true; url: string }
  | { ok: false; error?: string; missing: boolean };

const INVALID = "Use um endereço como loja.com.br.";

export function createSite(raw: string): SiteResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, missing: true };
  if (/\s/.test(trimmed) || trimmed.includes("\\")) {
    return { ok: false, missing: false, error: trimmed.includes(" ") ? "O endereço não pode ter espaço." : INVALID };
  }

  const scheme = trimmed.match(/^([a-z][a-z0-9+.-]*):/i);
  if (scheme) {
    const name = scheme[1].toLowerCase();
    if (name !== "http" && name !== "https") {
      return { ok: false, missing: false, error: "Use um link http ou https." };
    }
  }

  const candidate = scheme
    ? trimmed.replace(/^([a-z][a-z0-9+.-]*):/i, (_, name: string) => `${name.toLowerCase()}:`)
    : trimmed.startsWith("//")
      ? `https:${trimmed}`
      : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { ok: false, missing: false, error: INVALID };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, missing: false, error: "Use um link http ou https." };
  }
  if (!parsed.hostname) {
    return { ok: false, missing: false, error: INVALID };
  }

  const url =
    parsed.pathname === "/" && !parsed.search && !parsed.hash
      ? `${parsed.protocol}//${parsed.host}`
      : parsed.href;

  if (url.length > SITE_URL_MAX) {
    return { ok: false, missing: false, error: "O endereço passa de 500 caracteres." };
  }

  return { ok: true, url };
}
