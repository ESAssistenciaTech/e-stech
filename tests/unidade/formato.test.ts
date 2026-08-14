import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  codigo,
  data,
  dataHora,
  diasDesde,
  moeda,
  soDigitos,
  telefone,
} from "@/lib/formato";

/**
 * O `Intl` separa `R$` do número com espaço não-quebrável (U+00A0), não com
 * espaço comum. Comparar com `"R$ 120,50"` digitado no teclado dá falso
 * negativo — a armadilha mordeu quatro vezes durante a construção. Quem
 * compara moeda normaliza antes.
 */
function semEspacoTeimoso(texto: string) {
  return texto.replace(/ /g, " ");
}

describe("moeda", () => {
  test("formata em real, com vírgula decimal", () => {
    assert.equal(semEspacoTeimoso(moeda(120.5)), "R$ 120,50");
  });

  test("usa espaço não-quebrável, e é por isso que se normaliza", () => {
    assert.ok(moeda(10).includes(" "));
  });

  test("nulo e indefinido viram zero, não quebram a tela", () => {
    assert.equal(semEspacoTeimoso(moeda(null)), "R$ 0,00");
    assert.equal(semEspacoTeimoso(moeda(undefined)), "R$ 0,00");
  });

  test("negativo aparece negativo", () => {
    assert.ok(moeda(-150).includes("150,00"));
    assert.ok(moeda(-150).startsWith("-"));
  });
});

describe("codigo", () => {
  test("quebra em blocos, para ditar por telefone", () => {
    assert.equal(codigo("4K792X"), "4K7-92X");
  });

  test("o que não tem seis caracteres passa intacto", () => {
    assert.equal(codigo("ABC"), "ABC");
    assert.equal(codigo("4K7-92X"), "4K7-92X");
  });
});

describe("telefone", () => {
  test("celular com nove dígitos", () => {
    assert.equal(telefone("11987654321"), "(11) 98765-4321");
  });

  test("fixo com oito", () => {
    assert.equal(telefone("1133334444"), "(11) 3333-4444");
  });

  test("já mascarado continua igual — guardamos só dígitos", () => {
    assert.equal(telefone("(11) 98765-4321"), "(11) 98765-4321");
  });

  test("número torto sai como veio, sem inventar máscara", () => {
    assert.equal(telefone("123"), "123");
    assert.equal(telefone(null), "—");
  });
});

describe("soDigitos", () => {
  test("tira máscara, espaço e sinal", () => {
    assert.equal(soDigitos("+55 (11) 98765-4321"), "5511987654321");
  });

  test("texto sem dígito vira vazio", () => {
    assert.equal(soDigitos("abc"), "");
  });
});

describe("data", () => {
  test("nulo vira travessão, não 'Invalid Date'", () => {
    assert.equal(data(null), "—");
    assert.equal(dataHora(undefined), "—");
  });
});

describe("diasDesde", () => {
  test("sem data não há contagem", () => {
    assert.equal(diasDesde(null), null);
  });

  test("conta dias corridos", () => {
    const tresDias = new Date(Date.now() - 3 * 86_400_000).toISOString();
    assert.equal(diasDesde(tresDias), 3);
  });

  test("agora mesmo é zero, e é o que dá a barra fina na lista", () => {
    assert.equal(diasDesde(new Date().toISOString()), 0);
  });
});
