import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { linkWhatsApp, preencher, situacaoSugerida } from "@/lib/mensagem";

const DADOS = {
  cliente: "José Carlos da Silva",
  loja: "E&S Tech",
  codigo: "4K792X",
  aparelho: "Galaxy A14",
  valor: 450,
  saldo: 150,
  link: "https://estech.example/acompanhar/4K792X",
};

describe("preencher", () => {
  test("trata o cliente pelo primeiro nome", () => {
    assert.equal(preencher("Oi {cliente}!", DADOS), "Oi José!");
  });

  test("formata o código em blocos e o valor em real", () => {
    const texto = preencher("OS {codigo} — {valor}", DADOS);
    assert.ok(texto.includes("4K7-92X"));
    assert.ok(texto.includes("450,00"));
  });

  test("aparelho ausente vira a palavra genérica, não 'null'", () => {
    const texto = preencher("Seu {aparelho} está pronto", {
      ...DADOS,
      aparelho: null,
    });
    assert.equal(texto, "Seu aparelho está pronto");
  });

  test("troca todas as ocorrências da mesma variável", () => {
    assert.equal(preencher("{cliente}, {cliente}", DADOS), "José, José");
  });

  test("variável que não existe fica como está, sem sumir texto", () => {
    assert.equal(preencher("Oi {sobrenome}", DADOS), "Oi {sobrenome}");
  });
});

describe("linkWhatsApp", () => {
  /** Sem o 55 o wa.me abre conversa vazia e parece sistema quebrado. */
  test("põe o código do país no número anotado sem ele", () => {
    const link = linkWhatsApp("11987654321", "oi");
    assert.ok(link!.startsWith("https://wa.me/5511987654321?text="));
  });

  test("número que já veio com o país não ganha outro", () => {
    const link = linkWhatsApp("5511987654321", "oi");
    assert.ok(link!.startsWith("https://wa.me/5511987654321?text="));
  });

  test("ignora máscara", () => {
    const link = linkWhatsApp("(11) 98765-4321", "oi");
    assert.ok(link!.includes("5511987654321"));
  });

  test("escapa a mensagem", () => {
    const link = linkWhatsApp("11987654321", "Oi José, R$ 450");
    assert.ok(link!.includes("Jos%C3%A9"));
    assert.ok(!link!.includes(" "));
  });

  test("número curto demais não vira link — melhor nada que link quebrado", () => {
    assert.equal(linkWhatsApp("123", "oi"), null);
    assert.equal(linkWhatsApp(null, "oi"), null);
  });
});

describe("situacaoSugerida", () => {
  test("pronto sugere aviso de retirada", () => {
    assert.equal(situacaoSugerida("pronto", 0), "pronto");
  });

  test("orçamento enviado sugere o texto de orçamento", () => {
    assert.equal(situacaoSugerida("orcamento_enviado", 0), "orcamento");
  });

  test("entregue devendo sugere cobrança", () => {
    assert.equal(situacaoSugerida("entregue", 150), "cobranca");
  });

  test("entregue e quitado não sugere cobrança", () => {
    assert.equal(situacaoSugerida("entregue", 0), "entrada");
  });

  test("qualquer outro estado cai no aviso de entrada", () => {
    assert.equal(situacaoSugerida("em_conserto", 0), "entrada");
  });
});
