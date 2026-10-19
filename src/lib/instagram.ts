export type InstagramResult =
  | { ok: true; username: string; url: string }
  | { ok: false; error?: string; missing: boolean };

export function createInstagram(raw: string): InstagramResult {
  let value = raw.trim();
  if (!value) return { ok: false, missing: true };

  value = value.replace(/^@+/, "");
  value = value.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "");
  value = value.split(/[/?#]/)[0] ?? "";

  if (!value) {
    return { ok: false, missing: false, error: "Cole o usuário ou o link do perfil." };
  }
  if (value.length > 30) {
    return {
      ok: false,
      missing: false,
      error: "Usuário do Instagram tem no máximo 30 caracteres.",
    };
  }
  if (!/^[A-Za-z0-9._]+$/.test(value)) {
    return {
      ok: false,
      missing: false,
      error: "Use só letras, números, ponto e underline.",
    };
  }
  if (value.startsWith(".") || value.endsWith(".") || value.includes("..")) {
    return {
      ok: false,
      missing: false,
      error: "O usuário não pode começar, terminar ou repetir ponto.",
    };
  }

  return {
    ok: true,
    username: value,
    url: `https://www.instagram.com/${value}/`,
  };
}
