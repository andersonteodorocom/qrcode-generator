export type WifiSecurity = "WPA" | "WEP" | "nopass";

export type WifiForm = {
  ssid: string;
  password: string;
  security: WifiSecurity;
  hidden: boolean;
};

export type WifiSuccess = {
  ok: true;
  payload: string;
  ssid: string;
  security: WifiSecurity;
  hidden: boolean;
  password: string;
};

export type WifiFailure = {
  ok: false;
  errors: Partial<Record<"ssid" | "password", string>>;
  missing: string[];
};

export type WifiResult = WifiSuccess | WifiFailure;

export function escapeWifi(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

export function buildWifiPayload(input: {
  ssid: string;
  password: string;
  security: WifiSecurity;
  hidden: boolean;
}): string {
  const fields = [`T:${input.security}`, `S:${escapeWifi(input.ssid)}`];
  if (input.security !== "nopass") fields.push(`P:${escapeWifi(input.password)}`);
  if (input.hidden) fields.push("H:true");
  return `WIFI:${fields.map((field) => `${field};`).join("")};`;
}

function utf8Length(value: string): number {
  return new TextEncoder().encode(value).length;
}

function hasControlChar(value: string): boolean {
  return /[\u0000-\u001F\u007F]/.test(value);
}

function passwordError(security: WifiSecurity, password: string): string | null {
  if (security === "nopass") return null;
  if (!password) return null;
  if (hasControlChar(password)) return "A senha não pode ter quebra de linha.";
  if (security === "WPA") {
    if (password.length < 8) return "Senha WPA precisa de pelo menos 8 caracteres.";
    if (password.length > 63) return "Senha WPA aceita no máximo 63 caracteres.";
    return null;
  }
  const hex = /^[0-9A-Fa-f]+$/.test(password);
  const valid =
    password.length === 5 ||
    password.length === 13 ||
    (hex && (password.length === 10 || password.length === 26));
  if (!valid) {
    return "Senha WEP tem 5 ou 13 caracteres, ou 10 ou 26 dígitos hexadecimais.";
  }
  return null;
}

export function createWifi(form: WifiForm): WifiResult {
  const errors: WifiFailure["errors"] = {};
  const missing: string[] = [];
  const ssid = form.ssid.trim();

  if (!ssid) missing.push("nome da rede");
  else if (hasControlChar(ssid)) errors.ssid = "O nome da rede não pode ter quebra de linha.";
  else if (utf8Length(ssid) > 32) {
    errors.ssid = "O nome da rede aceita no máximo 32 bytes.";
  }

  const passwordErrorMessage = passwordError(form.security, form.password);
  if (form.security !== "nopass" && !form.password) missing.push("senha");
  else if (passwordErrorMessage) errors.password = passwordErrorMessage;

  if (!ssid || Object.keys(errors).length > 0 || missing.length > 0) {
    return { ok: false, errors, missing };
  }

  return {
    ok: true,
    payload: buildWifiPayload({
      ssid,
      password: form.password,
      security: form.security,
      hidden: form.hidden,
    }),
    ssid,
    security: form.security,
    hidden: form.hidden,
    password: form.password,
  };
}

export function securityLabel(security: WifiSecurity): string {
  if (security === "WPA") return "WPA2 / WPA3";
  if (security === "WEP") return "WEP";
  return "Aberta";
}
