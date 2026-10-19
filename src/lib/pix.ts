import { foldAscii } from "./ascii";

/**
 * BR Code estático do Pix, conforme o Manual de Padrões para Iniciação do Pix.
 * O exemplo oficial do Banco Central (chave aleatória, sem valor, txid `***`)
 * produz o CRC 1D3D. QR estático não leva o campo 01 — esse campo, com valor 12,
 * marca QR dinâmico de uso único.
 */

const DDDS = new Set([
  "11", "12", "13", "14", "15", "16", "17", "18", "19",
  "21", "22", "24", "27", "28",
  "31", "32", "33", "34", "35", "37", "38",
  "41", "42", "43", "44", "45", "46", "47", "48", "49",
  "51", "53", "54", "55",
  "61", "62", "63", "64", "65", "66", "67", "68", "69",
  "71", "73", "74", "75", "77", "79",
  "81", "82", "83", "84", "85", "86", "87", "88", "89",
  "91", "92", "93", "94", "95", "96", "97", "98", "99",
]);

const CNPJ_WEIGHTS_FIRST = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const CNPJ_WEIGHTS_SECOND = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const EMAIL_PATTERN =
  /^[a-z0-9._%+-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/;

export type PixKeyType = "cpf" | "cnpj" | "celular" | "email";
export type AmountMode = "livre" | "fixo";

export type PixForm = {
  keyType: PixKeyType;
  key: string;
  name: string;
  city: string;
  amountMode: AmountMode;
  amount: string;
  txid: string;
  note: string;
};

export type PixSuccess = {
  ok: true;
  payload: string;
  displayKey: string;
  keyLabel: "CPF" | "CNPJ" | "Celular" | "E-mail";
  name: string;
  encodedName: string;
  city: string;
  encodedCity: string;
  amountLabel: string | null;
  note: string | null;
  txid: string | null;
};

export type PixFailure = {
  ok: false;
  errors: Partial<Record<"key" | "name" | "city" | "amount" | "note", string>>;
  missing: string[];
};

export type PixResult = PixSuccess | PixFailure;

export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
      else crc <<= 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function field(id: string, value: string): string {
  if (value.length > 99) {
    throw new Error(`Campo ${id} passa de 99 caracteres.`);
  }
  return `${id}${value.length.toString().padStart(2, "0")}${value}`;
}

export function buildStaticPixPayload(input: {
  key: string;
  name: string;
  city: string;
  amount?: string | null;
  info?: string | null;
  txid?: string | null;
}): string {
  const merchant = [
    field("00", "br.gov.bcb.pix"),
    field("01", input.key),
    input.info ? field("02", input.info) : "",
  ].join("");

  const txid = input.txid ? input.txid : "***";
  const body = [
    field("00", "01"),
    field("26", merchant),
    field("52", "0000"),
    field("53", "986"),
    input.amount ? field("54", input.amount) : "",
    field("58", "BR"),
    field("59", input.name),
    field("60", input.city),
    field("62", field("05", txid)),
  ].join("");

  const withSlot = `${body}6304`;
  return withSlot + crc16(withSlot);
}

export function isValidCpf(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

  const check = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += Number(digits[i]) * (length + 1 - i);
    }
    const mod = (sum * 10) % 11;
    return mod === 10 ? 0 : mod;
  };

  return check(9) === Number(digits[9]) && check(10) === Number(digits[10]);
}

export function formatCpf(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  const parts = [
    digits.slice(0, 3),
    digits.slice(3, 6),
    digits.slice(6, 9),
    digits.slice(9, 11),
  ];
  if (digits.length <= 3) return parts[0];
  if (digits.length <= 6) return `${parts[0]}.${parts[1]}`;
  if (digits.length <= 9) return `${parts[0]}.${parts[1]}.${parts[2]}`;
  return `${parts[0]}.${parts[1]}.${parts[2]}-${parts[3]}`;
}

function cnpjDigit(digits: string, weights: number[]): number {
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += Number(digits[i]) * weights[i];
  }
  const mod = sum % 11;
  return mod < 2 ? 0 : 11 - mod;
}

export function isValidCnpj(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) return false;
  if (cnpjDigit(digits, CNPJ_WEIGHTS_FIRST) !== Number(digits[12])) return false;
  return cnpjDigit(digits, CNPJ_WEIGHTS_SECOND) === Number(digits[13]);
}

export function formatCnpj(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 14);
  const parts = [
    digits.slice(0, 2),
    digits.slice(2, 5),
    digits.slice(5, 8),
    digits.slice(8, 12),
    digits.slice(12, 14),
  ];
  if (digits.length <= 2) return parts[0];
  if (digits.length <= 5) return `${parts[0]}.${parts[1]}`;
  if (digits.length <= 8) return `${parts[0]}.${parts[1]}.${parts[2]}`;
  if (digits.length <= 12) return `${parts[0]}.${parts[1]}.${parts[2]}/${parts[3]}`;
  return `${parts[0]}.${parts[1]}.${parts[2]}/${parts[3]}-${parts[4]}`;
}

export function nationalPhoneDigits(raw: string): string {
  const trimmed = raw.trim();
  let digits = trimmed.replace(/\D/g, "");
  const pastedWithCountry =
    trimmed.startsWith("+") ||
    (digits.startsWith("55") && (digits.length === 12 || digits.length === 13));
  if (pastedWithCountry && digits.startsWith("55")) digits = digits.slice(2);
  return digits.slice(0, 11);
}

export function formatPhone(raw: string): string {
  const digits = nationalPhoneDigits(raw);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function phoneToPixKey(raw: string): string | null {
  const digits = nationalPhoneDigits(raw);
  if (digits.length !== 11) return null;
  const ddd = digits.slice(0, 2);
  if (!DDDS.has(ddd) || digits[2] !== "9") return null;
  return `+55${digits}`;
}

export function formatEmail(raw: string): string {
  return raw.replace(/\s+/g, "").toLowerCase().slice(0, 77);
}

export function isValidEmail(value: string): boolean {
  if (value.length > 77 || value !== value.toLowerCase() || /\s/.test(value)) return false;
  if (!value.includes("@") || value.includes("..")) return false;
  return EMAIL_PATTERN.test(value);
}

export function formatAmountTyping(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 12);
  if (!digits) return "";
  const padded = digits.padStart(3, "0");
  const ints = padded.slice(0, -2).replace(/^0+(?=\d)/, "");
  const dec = padded.slice(-2);
  return `${Number(ints).toLocaleString("pt-BR")},${dec}`;
}

export function amountToEmv(formatted: string): string | null {
  const digits = formatted.replace(/\D/g, "").slice(0, 12);
  if (!digits) return null;
  const padded = digits.padStart(3, "0");
  const ints = padded.slice(0, -2).replace(/^0+(?=\d)/, "");
  const dec = padded.slice(-2);
  if (ints === "0" && dec === "00") return null;
  const emv = `${ints}.${dec}`;
  if (emv.length > 13) return null;
  return emv;
}

export function formatBrlFromEmv(emv: string): string {
  const [ints, dec] = emv.split(".");
  return `R$ ${Number(ints).toLocaleString("pt-BR")},${dec}`;
}

export function sanitizeTxid(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, "").slice(0, 25);
}

/** Espaço do recado (campo 02) depois de GUI e chave, teto de 72 do manual. */
export function maxNoteLength(key: string): number {
  const used = 4 + "br.gov.bcb.pix".length + 4 + key.length;
  return Math.max(0, Math.min(72, 99 - used - 4));
}

function hasVisibleChar(value: string): boolean {
  return /[A-Za-z0-9]/.test(value);
}

export function createPix(form: PixForm): PixResult {
  const errors: PixFailure["errors"] = {};
  const missing: string[] = [];

  let pixKey = "";
  let displayKey = "";
  let keyLabel: PixSuccess["keyLabel"] = "CPF";

  if (form.keyType === "cpf") {
    keyLabel = "CPF";
    const digits = form.key.replace(/\D/g, "");
    displayKey = formatCpf(digits);
    if (!digits) missing.push("CPF");
    else if (digits.length < 11) missing.push("o restante do CPF");
    else if (!isValidCpf(digits)) {
      errors.key = "Esse CPF não confere. Os dígitos finais não fecham.";
    } else pixKey = digits;
  } else if (form.keyType === "cnpj") {
    keyLabel = "CNPJ";
    const digits = form.key.replace(/\D/g, "");
    displayKey = formatCnpj(digits);
    if (!digits) missing.push("CNPJ");
    else if (digits.length < 14) missing.push("o restante do CNPJ");
    else if (!isValidCnpj(digits)) {
      errors.key = "Esse CNPJ não confere. Os dígitos finais não fecham.";
    } else pixKey = digits;
  } else if (form.keyType === "email") {
    keyLabel = "E-mail";
    const email = formatEmail(form.key);
    displayKey = email;
    if (!email) missing.push("e-mail");
    else if (!isValidEmail(email)) {
      errors.key = "Use um e-mail válido, como financeiro@estudio.com.";
    } else pixKey = email;
  } else {
    keyLabel = "Celular";
    const digits = nationalPhoneDigits(form.key);
    displayKey = formatPhone(digits);
    if (!digits) missing.push("celular");
    else if (digits.length < 11) missing.push("o celular com DDD");
    else if (!DDDS.has(digits.slice(0, 2))) {
      errors.key = "Esse DDD não existe. Use o DDD do celular, como 11 ou 21.";
    } else if (digits[2] !== "9") {
      errors.key =
        "Pix por telefone usa celular, com o 9 na frente. Exemplo: (11) 98888-7777.";
    } else pixKey = `+55${digits}`;
  }

  const encodedName = foldAscii(form.name).slice(0, 99);
  const name = form.name.trim().replace(/\s+/g, " ");
  if (!name) missing.push("nome");
  else if (!hasVisibleChar(encodedName)) {
    errors.name = "O nome precisa ter letra ou número. Acento não entra no código.";
  } else if (encodedName.length > 25) {
    errors.name = `O nome no QR aceita 25 caracteres. Este ficou com ${encodedName.length}.`;
  }

  const encodedCity = foldAscii(form.city).slice(0, 99);
  const city = form.city.trim().replace(/\s+/g, " ");
  if (!city) missing.push("cidade");
  else if (!hasVisibleChar(encodedCity)) {
    errors.city = "A cidade precisa ter letra ou número. Acento não entra no código.";
  } else if (encodedCity.length > 15) {
    errors.city = `A cidade no QR aceita 15 caracteres. Esta ficou com ${encodedCity.length}.`;
  }

  let amount: string | null = null;
  if (form.amountMode === "fixo") {
    if (!form.amount.trim()) missing.push("valor");
    else {
      amount = amountToEmv(form.amount);
      if (!amount) errors.amount = "Informe um valor maior que zero.";
    }
  }

  const encodedNote = foldAscii(form.note);
  const noteLimit = pixKey ? maxNoteLength(pixKey) : 72;
  if (form.note.trim() && !encodedNote) {
    errors.note = "Esse recado não entra no QR. Use texto simples, sem emoji.";
  } else if (encodedNote.length > noteLimit) {
    errors.note = `O recado aceita ${noteLimit} caracteres junto com essa chave.`;
  }

  const txid = sanitizeTxid(form.txid);
  const ready =
    pixKey &&
    encodedName.length > 0 &&
    encodedName.length <= 25 &&
    encodedCity.length > 0 &&
    encodedCity.length <= 15 &&
    Object.keys(errors).length === 0 &&
    missing.length === 0;

  if (!ready) return { ok: false, errors, missing };

  const note = encodedNote ? encodedNote.slice(0, noteLimit) : null;
  const payload = buildStaticPixPayload({
    key: pixKey,
    name: encodedName,
    city: encodedCity,
    amount,
    info: note,
    txid: txid || null,
  });

  return {
    ok: true,
    payload,
    displayKey,
    keyLabel,
    name,
    encodedName,
    city,
    encodedCity,
    amountLabel: amount ? formatBrlFromEmv(amount) : null,
    note,
    txid: txid || null,
  };
}
