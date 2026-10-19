import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  amountToEmv,
  buildStaticPixPayload,
  createPix,
  crc16,
  formatAmountTyping,
  formatCnpj,
  isValidCnpj,
  isValidCpf,
  maxNoteLength,
  phoneToPixKey,
} from "./pix";

const OFFICIAL =
  "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D";

describe("BR Code estático", () => {
  it("reproduz o exemplo do Manual de Padrões para Iniciação do Pix", () => {
    const payload = buildStaticPixPayload({
      key: "123e4567-e12b-12d1-a456-426655440000",
      name: "Fulano de Tal",
      city: "BRASILIA",
    });
    assert.equal(payload, OFFICIAL);
    assert.equal(crc16(OFFICIAL.slice(0, -4)), "1D3D");
  });

  it("coloca valor, recado e txid nos campos do manual", () => {
    const payload = buildStaticPixPayload({
      key: "52998224725",
      name: "Maria Souza",
      city: "Recife",
      amount: "10.50",
      info: "Bolo",
      txid: "mesa12",
    });
    assert.match(payload, /011152998224725/);
    assert.match(payload, /0204Bolo/);
    assert.match(payload, /540510\.50/);
    assert.match(payload, /0506mesa12/);
    assert.equal(payload.slice(-4), crc16(payload.slice(0, -4)));
    assert.equal(payload.includes("010211"), false);
  });

  it("aceita CPF válido e celular no formato +55", () => {
    assert.equal(isValidCpf("529.982.247-25"), true);
    assert.equal(isValidCpf("111.111.111-11"), false);
    assert.equal(phoneToPixKey("+55 (11) 98888-7777"), "+5511988887777");
    assert.equal(phoneToPixKey("55988887777"), "+5555988887777");

    const cpf = createPix({
      keyType: "cpf",
      key: "529.982.247-25",
      name: "São João",
      city: "São Paulo",
      amountMode: "livre",
      amount: "",
      txid: "",
      note: "",
    });
    assert.equal(cpf.ok, true);
    if (!cpf.ok) return;
    assert.match(cpf.payload, /011152998224725/);
    assert.match(cpf.payload, /5908Sao Joao/);
    assert.match(cpf.payload, /6009Sao Paulo/);
    assert.equal(cpf.amountLabel, null);

    const phone = createPix({
      keyType: "celular",
      key: "11988887777",
      name: "Maria Souza",
      city: "Recife",
      amountMode: "fixo",
      amount: "10,50",
      txid: "pedido-1",
      note: "Mesa",
    });
    assert.equal(phone.ok, true);
    if (!phone.ok) return;
    assert.match(phone.payload, /0114\+5511988887777/);
    assert.equal(phone.amountLabel, "R$ 10,50");
    assert.equal(phone.txid, "pedido1");
  });

  it("aceita CNPJ e e-mail e encolhe o recado de um e-mail longo", () => {
    assert.equal(isValidCnpj("11.444.777/0001-61"), true);
    assert.equal(isValidCnpj("11.111.111/1111-11"), false);
    assert.equal(formatCnpj("11444777000161"), "11.444.777/0001-61");

    const cnpj = createPix({
      keyType: "cnpj",
      key: "11.444.777/0001-61",
      name: "Padaria Luz",
      city: "Recife",
      amountMode: "livre",
      amount: "",
      txid: "",
      note: "",
    });
    assert.equal(cnpj.ok, true);
    if (!cnpj.ok) return;
    assert.equal(cnpj.keyLabel, "CNPJ");
    assert.equal(cnpj.displayKey, "11.444.777/0001-61");
    assert.match(cnpj.payload, /011411444777000161/);
    assert.equal(cnpj.payload.includes("010211"), false);

    const email = createPix({
      keyType: "email",
      key: "Financeiro@Estudio.com",
      name: "Estudio Lina",
      city: "Recife",
      amountMode: "livre",
      amount: "",
      txid: "",
      note: "",
    });
    assert.equal(email.ok, true);
    if (!email.ok) return;
    assert.equal(email.keyLabel, "E-mail");
    assert.equal(email.displayKey, "financeiro@estudio.com");
    assert.match(email.payload, /0122financeiro@estudio.com/);

    const invalid = createPix({
      keyType: "email",
      key: "sem-arroba",
      name: "Estudio",
      city: "Recife",
      amountMode: "livre",
      amount: "",
      txid: "",
      note: "",
    });
    assert.equal(invalid.ok, false);

    const longKey = `${"a".repeat(64)}@estudio.com`;
    assert.equal(longKey.length, 76);
    assert.ok(maxNoteLength(longKey) < 72);
    const crowded = createPix({
      keyType: "email",
      key: longKey,
      name: "Loja",
      city: "Recife",
      amountMode: "livre",
      amount: "",
      txid: "",
      note: "x".repeat(maxNoteLength(longKey) + 1),
    });
    assert.equal(crowded.ok, false);
  });

  it("formata centavos e recusa valor zero", () => {
    assert.equal(formatAmountTyping("1050"), "10,50");
    assert.equal(formatAmountTyping("1"), "0,01");
    assert.equal(amountToEmv("1.234,56"), "1234.56");
    assert.equal(amountToEmv("0,00"), null);
  });
});
