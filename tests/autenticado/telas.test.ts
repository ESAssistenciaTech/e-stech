import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  MARCA,
  cookieDeSessao,
  entrar,
  semCredenciais,
  motivo,
  varrer,
} from "./sessao.mts";

/**
 * As telas, servidas de verdade, com sessão de verdade.
 *
 * O teste de fonte já garante que o comprovante não *menciona* senha nem
 * custo. Este garante o que importa de fato: que eles não saem no HTML — o
 * que pegaria um vazamento que chegasse por outro caminho, via propriedade
 * de componente ou objeto serializado inteiro.
 *
 * Precisa do servidor no ar (`npm run dev`). Sem ele, pula.
 */
const BASE = process.env.TESTE_URL ?? "http://localhost:3000";

async function alcancavel(url: string) {
  try {
    await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(3000) });
    return true;
  } catch {
    return false;
  }
}

const servidorNoAr = await alcancavel(BASE);

const pular = semCredenciais
  ? motivo
  : !servidorNoAr
    ? `servidor fora do ar em ${BASE} (rode npm run dev)`
    : false;

/** Valores escolhidos para não colidirem com nada mais da página. */
const SENHA_APARELHO = "9317-padrao-do-teste";
const CUSTO_PECA = 187.43;

describe("telas com sessão", { skip: pular }, () => {
  let supabase: SupabaseClient;
  let cookie: string;
  let osId: string;
  let codigoPublico: string;

  before(async () => {
    supabase = await entrar();
    await varrer(supabase);
    cookie = await cookieDeSessao(supabase);

    const { data: cliente } = await supabase
      .from("clientes")
      .insert({ nome: `${MARCA}cliente` })
      .select("id")
      .single();
    assert.ok(cliente);

    const { data: os } = await supabase
      .from("ordens_servico")
      .insert({
        cliente_id: cliente.id,
        solicitacao: `${MARCA}tela trincada`,
        senha_aparelho: SENHA_APARELHO,
        senha_tipo: "padrao",
        valor_peca: 300,
        custo_peca: CUSTO_PECA,
        status: "pronto",
      })
      .select("id, codigo_publico")
      .single();
    assert.ok(os);

    osId = os.id;
    codigoPublico = os.codigo_publico;
  });

  after(async () => {
    if (supabase) await varrer(supabase);
  });

  async function abrir(caminho: string, comSessao = true) {
    const resposta = await fetch(`${BASE}${caminho}`, {
      redirect: "manual",
      headers: comSessao ? { cookie } : {},
    });
    return { status: resposta.status, html: await resposta.text() };
  }

  test("sem cookie, rota administrativa manda para o login", async () => {
    const { status } = await abrir(`/os/${osId}`, false);
    assert.equal(status, 307);
  });

  test("com cookie, a OS abre", async () => {
    const { status, html } = await abrir(`/os/${osId}`);

    // Falhar aqui normalmente é o cookie não ter sido aceito — e um teste que
    // passasse assim não estaria provando nada sobre vazamento.
    assert.equal(status, 200, "a sessão não foi aceita pelo servidor");
    assert.ok(html.includes(codigoPublico), "abriu outra página");
  });

  /**
   * A senha e o custo aparecem na área privada de propósito. O comprovante é
   * papel que vai na mão do cliente, e ali não podem estar.
   */
  test("o comprovante não leva senha do aparelho nem custo da peça", async () => {
    const { status, html } = await abrir(`/os/${osId}/comprovante`);

    assert.equal(status, 200, "a sessão não foi aceita pelo servidor");
    assert.ok(html.includes(codigoPublico), "abriu outra página");

    assert.ok(
      !html.includes(SENHA_APARELHO),
      "a senha do aparelho saiu no comprovante",
    );
    for (const forma of ["187.43", "187,43"]) {
      assert.ok(
        !html.includes(forma),
        `o custo da peça saiu no comprovante (${forma})`,
      );
    }
  });

  /**
   * O portal é a única porta anônima. Vale conferir no HTML servido, e não só
   * no retorno da função: quem monta a página pode buscar mais do que mostra.
   */
  test("o portal público não leva senha, custo nem valor", async () => {
    const { status, html } = await abrir(
      `/acompanhar/${codigoPublico}`,
      false,
    );

    assert.equal(status, 200);
    assert.ok(!html.includes(SENHA_APARELHO), "a senha saiu no portal");
    for (const forma of ["187.43", "187,43", "300,00", "450,00"]) {
      assert.ok(!html.includes(forma), `valor no portal público (${forma})`);
    }
  });
});
