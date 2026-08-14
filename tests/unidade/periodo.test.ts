import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { inicioDoMes, intervalo } from "@/lib/periodo";

/** Um instante UTC, escrito como o servidor da Vercel o veria. */
function emUTC(iso: string) {
  return new Date(`${iso}Z`);
}

describe("inicioDoMes", () => {
  test("é o dia 1º às 00:00 no fuso da loja", () => {
    assert.equal(
      inicioDoMes(emUTC("2026-08-14T12:00:00")),
      "2026-08-01T00:00:00-03:00",
    );
  });

  /**
   * A regressão que motivou o arquivo inteiro.
   *
   * 01/09 às 01h UTC ainda é 31/08 às 22h no balcão. Antes disto, uma OS
   * entregue nesse horário saía do lucro de agosto e reaparecia em setembro.
   */
  test("noite do último dia do mês ainda é o mês que está acabando", () => {
    assert.equal(
      inicioDoMes(emUTC("2026-09-01T01:00:00")),
      "2026-08-01T00:00:00-03:00",
    );
  });

  test("madrugada do dia 1º já é o mês novo", () => {
    assert.equal(
      inicioDoMes(emUTC("2026-09-01T04:00:00")),
      "2026-09-01T00:00:00-03:00",
    );
  });
});

describe("intervalo", () => {
  test("mês corrente vai do dia 1º ao dia 1º do mês seguinte", () => {
    assert.deepEqual(intervalo("mes", emUTC("2026-08-14T12:00:00")), {
      inicio: "2026-08-01T00:00:00-03:00",
      fim: "2026-09-01T00:00:00-03:00",
    });
  });

  test("dezembro fecha em janeiro do ano seguinte", () => {
    assert.deepEqual(intervalo("mes", emUTC("2026-12-20T12:00:00")), {
      inicio: "2026-12-01T00:00:00-03:00",
      fim: "2027-01-01T00:00:00-03:00",
    });
  });

  test("mês passado em janeiro é dezembro do ano anterior", () => {
    assert.deepEqual(intervalo("passado", emUTC("2026-01-15T12:00:00")), {
      inicio: "2025-12-01T00:00:00-03:00",
      fim: "2026-01-01T00:00:00-03:00",
    });
  });

  test("ano vai de janeiro a janeiro", () => {
    assert.deepEqual(intervalo("ano", emUTC("2026-08-14T12:00:00")), {
      inicio: "2026-01-01T00:00:00-03:00",
      fim: "2027-01-01T00:00:00-03:00",
    });
  });

  test("tudo não filtra nada", () => {
    assert.deepEqual(intervalo("tudo", emUTC("2026-08-14T12:00:00")), {
      inicio: null,
      fim: null,
    });
  });

  /**
   * O intervalo é meio-aberto por decisão: fechar em 23:59:59 perderia o
   * último segundo do dia, e uma entrega ali some do relatório.
   */
  test("o último instante do mês cai dentro, o primeiro do seguinte cai fora", () => {
    const { inicio, fim } = intervalo("mes", emUTC("2026-08-14T12:00:00"));
    const ultimo = new Date("2026-08-31T23:59:59-03:00").getTime();
    const proximo = new Date("2026-09-01T00:00:00-03:00").getTime();

    assert.ok(ultimo >= new Date(inicio!).getTime());
    assert.ok(ultimo < new Date(fim!).getTime());
    assert.ok(proximo >= new Date(fim!).getTime());
  });
});
