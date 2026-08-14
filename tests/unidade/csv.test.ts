import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { paraCSV } from "@/lib/csv";

const COLUNAS = [
  { chave: "nome", rotulo: "Nome" },
  { chave: "valor", rotulo: "Valor" },
];

describe("paraCSV", () => {
  /**
   * O backup existe para ser aberto. Sem BOM o acento quebra no Excel, e com
   * vírgula no lugar do ponto e vírgula o arquivo abre tudo numa coluna só —
   * as duas coisas transformam backup em arquivo inútil.
   */
  test("começa com BOM, senão acento quebra no Excel", () => {
    assert.ok(paraCSV(COLUNAS, []).startsWith("﻿"));
  });

  test("separa por ponto e vírgula, não por vírgula", () => {
    const csv = paraCSV(COLUNAS, [{ nome: "Ana", valor: 120 }]);
    assert.ok(csv.includes("Nome;Valor"));
    assert.ok(csv.includes("Ana;120"));
  });

  test("quebra linha em CRLF", () => {
    const csv = paraCSV(COLUNAS, [{ nome: "Ana", valor: 1 }]);
    assert.equal(csv.split("\r\n").length, 2);
  });

  test("célula com o separador dentro vai entre aspas", () => {
    const csv = paraCSV(COLUNAS, [{ nome: "Silva; Ana", valor: 1 }]);
    assert.ok(csv.includes('"Silva; Ana"'));
  });

  test("aspas dentro do texto são dobradas", () => {
    const csv = paraCSV(COLUNAS, [{ nome: 'Tela "original"', valor: 1 }]);
    assert.ok(csv.includes('"Tela ""original"""'));
  });

  test("quebra de linha na observação não parte a linha do arquivo", () => {
    const csv = paraCSV(COLUNAS, [{ nome: "Cliente\nchato", valor: 1 }]);
    assert.equal(csv.split("\r\n").length, 2);
    assert.ok(csv.includes('"Cliente\nchato"'));
  });

  test("nulo e ausente viram célula vazia, não 'null'", () => {
    const csv = paraCSV(COLUNAS, [{ nome: null, valor: undefined }]);
    assert.ok(csv.endsWith(";"));
    assert.ok(!csv.includes("null"));
    assert.ok(!csv.includes("undefined"));
  });

  test("sem linha nenhuma ainda sai o cabeçalho", () => {
    assert.equal(paraCSV(COLUNAS, []), "﻿Nome;Valor");
  });
});
