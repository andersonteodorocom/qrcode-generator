"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Segmented, controlClass } from "@/components/field";
import { Plate, type PlateModel } from "@/components/plate";
import { PrintSheetPanel } from "@/components/print-sheet-panel";
import { filenamePart, foldAscii } from "@/lib/ascii";
import { createInstagram } from "@/lib/instagram";
import {
  createPix,
  formatAmountTyping,
  formatCnpj,
  formatCpf,
  formatEmail,
  formatPhone,
  isValidCnpj,
  isValidCpf,
  isValidEmail,
  maxNoteLength,
  phoneToPixKey,
  sanitizeTxid,
  type AmountMode,
  type PixKeyType,
} from "@/lib/pix";
import { createWifi, securityLabel, type WifiSecurity } from "@/lib/wifi";
import { cn } from "@/lib/utils";

type Mode = "pix" | "instagram" | "wifi";

const modes: { id: Mode; index: string; title: string; text: string }[] = [
  {
    id: "pix",
    index: "01",
    title: "Pix",
    text: "CPF, CNPJ, celular ou e-mail, no padrão estático do Banco Central. Não recebe pagamento — só grava a chave.",
  },
  {
    id: "instagram",
    index: "02",
    title: "Instagram",
    text: "A câmera abre o perfil. Serve em cartão, vitrine e embalagem.",
  },
  {
    id: "wifi",
    index: "03",
    title: "Wi-Fi",
    text: "Nome da rede e senha. A câmera do iPhone e do Android conecta.",
  },
];

function listMissing(missing: string[]): string {
  if (missing.length === 0) return "Corrija os campos marcados para gravar o QR.";
  if (missing.length === 1) return `Falta ${missing[0]}.`;
  const last = missing[missing.length - 1];
  return `Falta ${missing.slice(0, -1).join(", ")} e ${last}.`;
}

const keyFieldCopy: Record<
  PixKeyType,
  { label: string; hint: string; placeholder: string; inputMode: "numeric" | "email" }
> = {
  cpf: {
    label: "CPF",
    hint: "Só os números. A chave precisa já estar cadastrada no banco.",
    placeholder: "000.000.000-00",
    inputMode: "numeric",
  },
  celular: {
    label: "Celular com DDD",
    hint: "Exemplo: (11) 98888-7777. No código entra como +55.",
    placeholder: "(11) 98888-7777",
    inputMode: "numeric",
  },
  cnpj: {
    label: "CNPJ",
    hint: "Só os números. A chave precisa já estar cadastrada no banco.",
    placeholder: "00.000.000/0000-00",
    inputMode: "numeric",
  },
  email: {
    label: "E-mail",
    hint: "Minúsculas, sem espaço. No máximo 77 caracteres.",
    placeholder: "financeiro@estudio.com",
    inputMode: "email",
  },
};

function formatPixKey(keyType: PixKeyType, value: string): string {
  if (keyType === "cpf") return formatCpf(value);
  if (keyType === "cnpj") return formatCnpj(value);
  if (keyType === "email") return formatEmail(value);
  return formatPhone(value);
}

export function QrStudio() {
  const [mode, setMode] = useState<Mode>("pix");
  const [keyType, setKeyType] = useState<PixKeyType>("cpf");
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [amountMode, setAmountMode] = useState<AmountMode>("livre");
  const [amount, setAmount] = useState("");
  const [txid, setTxid] = useState("");
  const [note, setNote] = useState("");
  const [username, setUsername] = useState("");
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [security, setSecurity] = useState<WifiSecurity>("WPA");
  const [hidden, setHidden] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSecretOnCard, setShowSecretOnCard] = useState(false);

  const pix = useMemo(
    () =>
      createPix({
        keyType,
        key,
        name,
        city,
        amountMode,
        amount,
        txid,
        note,
      }),
    [keyType, key, name, city, amountMode, amount, txid, note],
  );
  const instagram = useMemo(() => createInstagram(username), [username]);
  const wifi = useMemo(
    () => createWifi({ ssid, password, security, hidden }),
    [ssid, password, security, hidden],
  );

  const noteLimit = useMemo(() => {
    if (keyType === "cpf" && isValidCpf(key)) return maxNoteLength(key.replace(/\D/g, ""));
    if (keyType === "cnpj" && isValidCnpj(key)) return maxNoteLength(key.replace(/\D/g, ""));
    const phone = phoneToPixKey(key);
    if (keyType === "celular" && phone) return maxNoteLength(phone);
    const email = formatEmail(key);
    if (keyType === "email" && isValidEmail(email)) return maxNoteLength(email);
    return 72;
  }, [keyType, key]);

  const active = modes.find((item) => item.id === mode) ?? modes[0];
  const plate = buildPlate({
    mode,
    pix,
    instagram,
    wifi,
    name,
    city,
    ssid,
    showSecretOnCard,
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12">
      <header className="no-print max-w-2xl">
        <p className="font-mono text-[11px] tracking-[0.22em] text-muted-foreground">
          OFICINA DE QR
        </p>
        <h1 className="font-display mt-2 text-5xl tracking-tight sm:text-6xl">
          Definitivo
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-7 text-muted-foreground">
          QR Code para imprimir e continuar usando. Pix com CPF, CNPJ, celular ou
          e-mail, perfil do Instagram e senha do Wi-Fi. O desenho nasce neste aparelho.
        </p>
      </header>

      <div className="mt-8 grid items-start gap-8 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_22.5rem]">
        <section className="no-print grid gap-6">
          <div className="grid gap-3">
            <div role="tablist" aria-label="Tipo de código" className="grid grid-cols-3 gap-2">
              {modes.map((item) => {
                const selected = item.id === mode;
                return (
                  <button
                    key={item.id}
                    id={`tab-${item.id}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls={`panel-${item.id}`}
                    onClick={() => setMode(item.id)}
                    className={cn(
                      "flex h-16 flex-col items-start justify-center rounded-2xl border px-3 text-left transition-colors",
                      selected
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-card text-foreground hover:border-foreground/30",
                    )}
                  >
                    <span
                      className={cn(
                        "font-mono text-[10px] tracking-[0.18em]",
                        selected ? "text-background/70" : "text-muted-foreground",
                      )}
                    >
                      {item.index}
                    </span>
                    <span className="text-sm font-medium sm:text-base">{item.title}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{active.text}</p>
          </div>

          <form
            id={`panel-${mode}`}
            role="tabpanel"
            aria-labelledby={`tab-${mode}`}
            noValidate
            onSubmit={(event) => event.preventDefault()}
            className="grid gap-5 rounded-[1.75rem] border border-border bg-card/80 p-5 sm:p-6"
          >
            {mode === "pix" ? (
              <>
                <Segmented
                  label="Chave"
                  value={keyType}
                  onChange={(value) => {
                    setKeyType(value);
                    setKey("");
                  }}
                  options={[
                    { value: "cpf", label: "CPF" },
                    { value: "cnpj", label: "CNPJ" },
                    { value: "celular", label: "Celular" },
                    { value: "email", label: "E-mail" },
                  ]}
                />
                <Field
                  id="pix-key"
                  label={keyFieldCopy[keyType].label}
                  error={pix.ok ? undefined : pix.errors.key}
                  hint={keyFieldCopy[keyType].hint}
                >
                  <Input
                    id="pix-key"
                    className={controlClass}
                    type={keyFieldCopy[keyType].inputMode === "email" ? "email" : "text"}
                    inputMode={keyFieldCopy[keyType].inputMode}
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder={keyFieldCopy[keyType].placeholder}
                    value={key}
                    aria-invalid={pix.ok ? undefined : Boolean(pix.errors.key)}
                    aria-describedby={
                      !pix.ok && pix.errors.key ? "pix-key-error" : "pix-key-hint"
                    }
                    onValueChange={(value) => setKey(formatPixKey(keyType, value))}
                  />
                </Field>
                <Field
                  id="pix-name"
                  label="Nome de quem recebe"
                  counter={`${foldAscii(name).length}/25`}
                  error={pix.ok ? undefined : pix.errors.name}
                  hint="O banco mostra o nome do cadastro da chave. Este campo só completa o padrão."
                >
                  <Input
                    id="pix-name"
                    className={controlClass}
                    autoComplete="name"
                    placeholder="Maria Souza"
                    value={name}
                    aria-invalid={pix.ok ? undefined : Boolean(pix.errors.name)}
                    aria-describedby={
                      !pix.ok && pix.errors.name ? "pix-name-error" : "pix-name-hint"
                    }
                    onValueChange={setName}
                  />
                </Field>
                <Field
                  id="pix-city"
                  label="Cidade"
                  counter={`${foldAscii(city).length}/15`}
                  error={pix.ok ? undefined : pix.errors.city}
                  hint="Acento sai do código para o app do banco ler sem erro."
                >
                  <Input
                    id="pix-city"
                    className={controlClass}
                    autoComplete="address-level2"
                    placeholder="Recife"
                    value={city}
                    aria-invalid={pix.ok ? undefined : Boolean(pix.errors.city)}
                    aria-describedby={
                      !pix.ok && pix.errors.city ? "pix-city-error" : "pix-city-hint"
                    }
                    onValueChange={setCity}
                  />
                </Field>
                <Segmented
                  label="Valor"
                  value={amountMode}
                  onChange={setAmountMode}
                  options={[
                    { value: "livre", label: "Valor livre" },
                    { value: "fixo", label: "Valor fixo" },
                  ]}
                />
                <p className="-mt-3 text-sm leading-5 text-muted-foreground">
                  {amountMode === "livre"
                    ? "Cada pessoa digita quanto vai pagar. É o cartão de balcão."
                    : "O mesmo valor entra toda vez. Serve para um produto ou uma taxa."}
                </p>
                {amountMode === "fixo" ? (
                  <Field
                    id="pix-amount"
                    label="Valor em reais"
                    error={pix.ok ? undefined : pix.errors.amount}
                  >
                    <Input
                      id="pix-amount"
                      className={controlClass}
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="0,00"
                      value={amount}
                      aria-invalid={pix.ok ? undefined : Boolean(pix.errors.amount)}
                      aria-describedby={!pix.ok && pix.errors.amount ? "pix-amount-error" : undefined}
                      onValueChange={(value) => setAmount(formatAmountTyping(value))}
                    />
                  </Field>
                ) : null}
                <Field
                  id="pix-txid"
                  label="Identificador"
                  counter={`${sanitizeTxid(txid).length}/25`}
                  hint="Opcional. Letras e números para você reconhecer o pagamento."
                >
                  <Input
                    id="pix-txid"
                    className={controlClass}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="mesa12"
                    value={txid}
                    aria-describedby="pix-txid-hint"
                    onValueChange={(value) => setTxid(sanitizeTxid(value))}
                  />
                </Field>
                <Field
                  id="pix-note"
                  label="Recado"
                  counter={`${foldAscii(note).length}/${noteLimit}`}
                  error={pix.ok ? undefined : pix.errors.note}
                  hint="Opcional. Algumas contas mostram esse texto para quem paga."
                >
                  <Input
                    id="pix-note"
                    className={controlClass}
                    autoComplete="off"
                    placeholder="Mesa 4"
                    value={note}
                    aria-invalid={pix.ok ? undefined : Boolean(pix.errors.note)}
                    aria-describedby={!pix.ok && pix.errors.note ? "pix-note-error" : "pix-note-hint"}
                    onValueChange={setNote}
                  />
                </Field>
              </>
            ) : null}

            {mode === "instagram" ? (
              <Field
                id="instagram-user"
                label="Usuário"
                error={instagram.ok ? undefined : instagram.error}
                hint="Pode colar o @ ou o link do perfil."
              >
                <Input
                  id="instagram-user"
                  className={controlClass}
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="estudio.lina"
                  value={username}
                  aria-invalid={instagram.ok ? undefined : Boolean(instagram.error)}
                  aria-describedby={
                    !instagram.ok && instagram.error
                      ? "instagram-user-error"
                      : "instagram-user-hint"
                  }
                  onValueChange={setUsername}
                />
              </Field>
            ) : null}

            {mode === "wifi" ? (
              <>
                <Field
                  id="wifi-ssid"
                  label="Nome da rede"
                  error={wifi.ok ? undefined : wifi.errors.ssid}
                  hint="O nome exato, do jeito que aparece no celular."
                >
                  <Input
                    id="wifi-ssid"
                    className={controlClass}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="Casa da Maria"
                    value={ssid}
                    aria-invalid={wifi.ok ? undefined : Boolean(wifi.errors.ssid)}
                    aria-describedby={
                      !wifi.ok && wifi.errors.ssid ? "wifi-ssid-error" : "wifi-ssid-hint"
                    }
                    onValueChange={setSsid}
                  />
                </Field>
                <Segmented
                  label="Proteção"
                  value={security}
                  onChange={setSecurity}
                  options={[
                    { value: "WPA", label: "WPA2" },
                    { value: "WEP", label: "WEP" },
                    { value: "nopass", label: "Aberta" },
                  ]}
                />
                <p className="-mt-3 text-sm leading-5 text-muted-foreground">
                  {security === "WPA"
                    ? "WPA2 também cobre WPA3. A câmera trata os dois do mesmo jeito."
                    : security === "WEP"
                      ? "WEP é o cadeado antigo. A senha tem 5 ou 13 caracteres."
                      : "Rede sem senha. O celular só confirma a conexão."}
                </p>
                {security !== "nopass" ? (
                  <Field
                    id="wifi-password"
                    label="Senha"
                    error={wifi.ok ? undefined : wifi.errors.password}
                    hint="A senha vai dentro do QR. Ela não aparece no cartão, a menos que você peça."
                  >
                    <div className="relative">
                      <Input
                        id="wifi-password"
                        className={cn(controlClass, "pr-12")}
                        type={showPassword ? "text" : "password"}
                        autoComplete="off"
                        spellCheck={false}
                        value={password}
                        aria-invalid={wifi.ok ? undefined : Boolean(wifi.errors.password)}
                        aria-describedby={
                          !wifi.ok && wifi.errors.password
                            ? "wifi-password-error"
                            : "wifi-password-hint"
                        }
                        onValueChange={setPassword}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-1/2 right-1.5 -translate-y-1/2"
                        aria-pressed={showPassword}
                        aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                        onClick={() => setShowPassword((current) => !current)}
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </Button>
                    </div>
                  </Field>
                ) : null}
                <label className="flex items-start gap-3 text-sm leading-5">
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 accent-foreground"
                    checked={hidden}
                    onChange={(event) => setHidden(event.target.checked)}
                  />
                  <span>
                    Rede oculta
                    <span className="mt-1 block text-muted-foreground">
                      O celular pode pedir o nome da rede mesmo com o QR.
                    </span>
                  </span>
                </label>
                {security !== "nopass" ? (
                  <label className="flex items-start gap-3 text-sm leading-5">
                    <input
                      type="checkbox"
                      className="mt-0.5 size-4 accent-foreground"
                      checked={showSecretOnCard}
                      onChange={(event) => setShowSecretOnCard(event.target.checked)}
                    />
                    <span>
                      Escrever a senha no cartão
                      <span className="mt-1 block text-muted-foreground">
                        O QR já carrega a senha. Esta opção só imprime ela ao lado.
                      </span>
                    </span>
                  </label>
                ) : null}
              </>
            ) : null}

            {plate.payload ? (
              <a href="#chapa" className="text-sm font-medium underline underline-offset-4 lg:hidden">
                Ver o cartão
              </a>
            ) : null}
          </form>
        </section>

        <div className="lg:sticky lg:top-6">
          <Plate model={plate} />
        </div>
      </div>

      <PrintSheetPanel shopName={name} pix={pix} instagram={instagram} wifi={wifi} />

      <footer className="no-print mt-10 max-w-2xl text-sm leading-6 text-muted-foreground">
        Chave Pix, senha e usuário não saem deste aparelho. O Pix segue o BR Code
        estático: não tem validade e deixa de funcionar se a chave for apagada do banco.
      </footer>
    </div>
  );
}

function buildPlate(input: {
  mode: Mode;
  pix: ReturnType<typeof createPix>;
  instagram: ReturnType<typeof createInstagram>;
  wifi: ReturnType<typeof createWifi>;
  name: string;
  city: string;
  ssid: string;
  showSecretOnCard: boolean;
}): PlateModel {
  if (input.mode === "instagram") {
    const ready = input.instagram.ok ? input.instagram : null;
    return {
      index: "02",
      kicker: "Instagram",
      title: ready ? `@${ready.username}` : "Instagram",
      accent: "instagram",
      lines: ready
        ? [
            { label: "Perfil", value: `@${ready.username}` },
            { label: "Link", value: ready.url.replace("https://www.", "") },
          ]
        : [],
      technical: null,
      footnote: "A câmera abre o perfil. Se o usuário mudar, este QR deixa de apontar para a conta.",
      empty: input.instagram.ok
        ? ""
        : input.instagram.missing
          ? "Falta o usuário."
          : "Corrija o usuário para gravar o QR.",
      alt: ready ? `QR Code do perfil @${ready.username} no Instagram` : "QR Code do Instagram",
      payload: ready ? ready.url : null,
      payloadLabel: "Ver o link",
      filename: `definitivo-instagram-${filenamePart(ready?.username ?? "perfil")}`,
    };
  }

  if (input.mode === "wifi") {
    const ready = input.wifi.ok ? input.wifi : null;
    const lines = ready
      ? [
          { label: "Rede", value: ready.ssid },
          { label: "Proteção", value: securityLabel(ready.security) },
          ...(ready.hidden ? [{ label: "Rede oculta", value: "Sim" }] : []),
          ...(input.showSecretOnCard && ready.security !== "nopass"
            ? [{ label: "Senha", value: ready.password }]
            : []),
        ]
      : [];
    return {
      index: "03",
      kicker: "Wi-Fi",
      title: input.ssid.trim() || "Wi-Fi",
      accent: "wifi",
      lines,
      technical: null,
      footnote:
        "A câmera do iPhone e do Android entra na rede. Se a senha ou o nome mudarem, gere outro cartão.",
      empty: input.wifi.ok ? "" : listMissing(input.wifi.missing),
      alt: ready ? `QR Code da rede Wi-Fi ${ready.ssid}` : "QR Code de Wi-Fi",
      payload: ready ? ready.payload : null,
      payloadLabel: "Ver o código da rede",
      filename: `definitivo-wifi-${filenamePart(ready?.ssid ?? input.ssid)}`,
    };
  }

  const ready = input.pix.ok ? input.pix : null;
  const changed =
    ready && (ready.name !== ready.encodedName || ready.city !== ready.encodedCity)
      ? `No código, sem acento: ${ready.encodedName} · ${ready.encodedCity}`
      : null;
  return {
    index: "01",
    kicker: "Pix estático",
    title: input.name.trim() || "Pix",
    accent: "pix",
    lines: ready
      ? [
          { label: ready.keyLabel, value: ready.displayKey },
          { label: "Cidade", value: input.city.trim() },
          { label: "Valor", value: ready.amountLabel ?? "Quem paga digita" },
          ...(ready.txid ? [{ label: "Identificador", value: ready.txid }] : []),
          ...(ready.note ? [{ label: "Recado", value: ready.note }] : []),
        ]
      : [],
    technical: changed,
    footnote:
      "Não vence. Quem paga abre o app do banco, aponta a câmera e confirma o nome da chave. Continua válido enquanto essa chave existir.",
    empty: input.pix.ok ? "" : listMissing(input.pix.missing),
    alt: ready ? `QR Code Pix da chave ${ready.displayKey}` : "QR Code Pix",
    payload: ready ? ready.payload : null,
    payloadLabel: "Ver o Pix copia e cola",
    filename: `definitivo-pix-${filenamePart(ready?.displayKey ?? "chave")}`,
  };
}
