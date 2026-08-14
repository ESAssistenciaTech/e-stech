import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { apurar, porServico, type LinhaLucro } from "@/lib/relatorio";

function os(parcial: Partial<LinhaLucro> = {}): LinhaLucro {
  return {
    id: "1",
    numero: 1,
    codigo_publico: "4K792X",
    valor_mao_obra: 0,
    valor_total: 0,
    custo_peca: 0,
    lucro: 0,
    data_entrega: "2026-08-10T14:00:00-03:00",
    ...parcial,
  };
}

describe("apurar", () => {
  test("período sem entrega zera tudo", () => {
    assert.deepEqual(apurar([]), {
      quantidade: 0,
      faturamento: 0,
      maoObra: 0,
      vendaPeca: 0,
      custoPeca: 0,
      lucro: 0,
      semCusto: 0,
    });
  });

  /** É o que a tela mostra empilhado; se não fechar, o número não se confere. */
  test("mão de obra mais peça vendida menos custo dá o lucro", () => {
    const total = apurar([
      os({ valor_mao_obra: 150, valor_total: 450, custo_peca: 180, lucro: 270 }),
      os({ valor_mao_obra: 80, valor_total: 80, custo_peca: 0, lucro: 80 }),
    ]);

    assert.equal(total.quantidade, 2);
    assert.equal(total.faturamento, 530);
    assert.equal(total.maoObra, 230);
    assert.equal(total.vendaPeca, 300);
    assert.equal(total.custoPeca, 180);
    assert.equal(total.lucro, 350);
    assert.equal(total.maoObra + total.vendaPeca - total.custoPeca, total.lucro);
  });

  /** numeric do Postgres às vezes chega como texto pelo PostgREST. */
  test("aceita número em texto", () => {
    const total = apurar([
      os({
        valor_mao_obra: "150.50",
        valor_total: "450.50",
        custo_peca: "180.25",
        lucro: "270.25",
      }),
    ]);

    assert.equal(total.maoObra, 150.5);
    assert.equal(total.vendaPeca, 300);
    assert.equal(total.lucro, 270.25);
  });

  test("conta como sem custo só quem cobrou peça e não registrou o custo", () => {
    const total = apurar([
      // Cobrou peça, não registrou custo: lucro inflado.
      os({ valor_mao_obra: 0, valor_total: 300, custo_peca: 0, lucro: 300 }),
      // Cobrou peça e registrou: em ordem.
      os({ valor_mao_obra: 0, valor_total: 300, custo_peca: 200, lucro: 100 }),
      // Serviço puro, sem peça nenhuma: não é dado faltando.
      os({ valor_mao_obra: 90, valor_total: 90, custo_peca: 0, lucro: 90 }),
    ]);

    assert.equal(total.semCusto, 1);
  });

  /** A conta do lucro mora na view. Somar é o trabalho daqui; refazer, não. */
  test("soma o lucro da view em vez de recalcular", () => {
    const total = apurar([
      os({ valor_mao_obra: 100, valor_total: 100, custo_peca: 0, lucro: 999 }),
    ]);

    assert.equal(total.lucro, 999);
  });

  test("prejuízo entra negativo, não some", () => {
    const total = apurar([
      os({ valor_mao_obra: 0, valor_total: 100, custo_peca: 250, lucro: -150 }),
    ]);

    assert.equal(total.lucro, -150);
  });
});

describe("porServico", () => {
  test("agrupa pelo nome, conta as ocorrências e soma o valor", () => {
    const linhas = porServico([
      { nome: "Troca de tela", valor: 300 },
      { nome: "Formatação", valor: 80 },
      { nome: "Troca de tela", valor: 250 },
    ]);

    assert.deepEqual(linhas, [
      { nome: "Troca de tela", quantidade: 2, valor: 550 },
      { nome: "Formatação", quantidade: 1, valor: 80 },
    ]);
  });

  test("ordena do maior valor para o menor, não pela contagem", () => {
    const linhas = porServico([
      { nome: "Limpeza", valor: 50 },
      { nome: "Limpeza", valor: 50 },
      { nome: "Limpeza", valor: 50 },
      { nome: "Troca de tela", valor: 400 },
    ]);

    assert.equal(linhas[0].nome, "Troca de tela");
  });

  test("sem serviço nenhum devolve lista vazia", () => {
    assert.deepEqual(porServico([]), []);
  });
});
