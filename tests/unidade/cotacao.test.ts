import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { comMargem, idadeCotacao } from "@/lib/cotacao";

/** ISO de N dias atrás, ao meio-dia, longe da virada. */
function diasAtras(dias: number) {
  return new Date(Date.now() - dias * 86_400_000 - 3_600_000).toISOString();
}

describe("comMargem", () => {
  test("aplica o percentual sobre o custo", () => {
    assert.equal(comMargem(200, 30), 260);
  });

  /** Número quebrado no balcão soa a cálculo feito na hora. */
  test("arredonda para cima na dezena", () => {
    assert.equal(comMargem(203, 30), 270);
    assert.equal(comMargem(201, 0), 210);
  });

  test("valor já redondo não sobe uma dezena à toa", () => {
    assert.equal(comMargem(100, 0), 100);
  });

  test("margem zero devolve o custo", () => {
    assert.equal(comMargem(150, 0), 150);
  });
});

describe("idadeCotacao", () => {
  test("hoje e ontem têm nome próprio", () => {
    assert.equal(idadeCotacao(diasAtras(0)).texto, "hoje");
    assert.equal(idadeCotacao(diasAtras(1)).texto, "ontem");
  });

  test("abaixo de um mês conta em dias", () => {
    assert.equal(idadeCotacao(diasAtras(12)).texto, "há 12 dias");
  });

  test("passando de um mês conta em meses", () => {
    assert.equal(idadeCotacao(diasAtras(35)).texto, "há 1 mês");
    assert.equal(idadeCotacao(diasAtras(95)).texto, "há 3 meses");
  });

  /**
   * A idade é parte da informação: repetir com confiança um preço de quatro
   * meses atrás é pior do que dizer "vou confirmar e te falo".
   */
  test("marca como velha a partir de sessenta dias", () => {
    assert.equal(idadeCotacao(diasAtras(59)).velha, false);
    assert.equal(idadeCotacao(diasAtras(61)).velha, true);
  });

  test("preço recente não é velho", () => {
    assert.equal(idadeCotacao(diasAtras(3)).velha, false);
  });
});
