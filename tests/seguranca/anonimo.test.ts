import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

/**
 * O que um visitante alcança com a chave publicável.
 *
 * Essa chave vai no bundle do navegador e é legível por qualquer um: não é
 * segredo, e não é ela que protege nada. Quem protege é o RLS. Este arquivo
 * bate no banco de verdade, sem sessão, e confere isso.
 *
 * Roda contra o projeto do `.env.local`. Sem as variáveis, pula em vez de
 * falhar — máquina nova e CI sem segredo não devem ver vermelho por isso.
 */

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CHAVE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const semAmbiente = !URL_SUPABASE || !CHAVE;
const motivo = "sem NEXT_PUBLIC_SUPABASE_* no ambiente";

const anonimo = semAmbiente ? null : createClient(URL_SUPABASE!, CHAVE!);

/** Tabelas que ninguém deslogado tem o que ver. */
const FECHADAS = [
  "ordens_servico",
  "clientes",
  "os_servicos",
  "movimentacoes_caixa",
  "os_fotos",
  "cotacoes",
  "fornecedores",
  "pecas",
  "modelos_mensagem",
  "dados_loja",
  "tipos_servico",
];

describe("acesso anônimo", { skip: semAmbiente ? motivo : false }, () => {
  for (const tabela of FECHADAS) {
    test(`${tabela} não devolve linha`, async () => {
      const { data, error } = await anonimo!.from(tabela).select("*").limit(1);

      // Sem policy o Postgres devolve conjunto vazio, não erro. Qualquer um
      // dos dois serve; linha devolvida é que não pode.
      assert.equal(
        data?.length ?? 0,
        0,
        `${tabela} devolveu linha para anônimo${error ? "" : " (sem erro)"}`,
      );
    });
  }

  /**
   * A view já vazou uma vez, por nascer sem security_invoker. É o caso em
   * que o RLS das tabelas de baixo existe e mesmo assim o dado sai.
   */
  test("a view de totais não devolve linha", async () => {
    const { data } = await anonimo!
      .from("ordens_servico_totais")
      .select("*")
      .limit(1);

    assert.equal(data?.length ?? 0, 0, "ordens_servico_totais vazou valores");
  });

  test("não dá para escrever nada", async () => {
    const { error } = await anonimo!
      .from("clientes")
      .insert({ nome: "teste de segurança" });

    assert.ok(error, "anônimo conseguiu inserir cliente");
  });
});

describe("portal público", { skip: semAmbiente ? motivo : false }, () => {
  test("código inexistente não devolve nada, e não vaza erro do banco", async () => {
    const { data, error } = await anonimo!.rpc("consultar_os", {
      codigo: "ZZZZZZ",
    });

    assert.equal(error, null);
    assert.equal(data?.length ?? 0, 0);
  });

  /**
   * Se a função algum dia passar a devolver a linha inteira, é aqui que
   * aparece — e antes de ir para o ar.
   */
  test("quando devolve OS, devolve só os sete campos públicos", async () => {
    const { data } = await anonimo!.rpc("consultar_os", { codigo: "ZZZZZZ" });
    const linha = (data as Record<string, unknown>[] | null)?.[0];
    if (!linha) return; // Código inexistente de propósito: nada a conferir.

    assert.deepEqual(Object.keys(linha).sort(), [
      "aparelho",
      "codigo_publico",
      "data_conclusao",
      "data_entrada",
      "data_entrega",
      "servicos",
      "status",
    ]);
  });

  test("dados da loja saem sem a margem", async () => {
    const { data, error } = await anonimo!.rpc("dados_loja_publicos");
    assert.equal(error, null);

    const loja = (data as Record<string, unknown>[] | null)?.[0];
    assert.ok(loja, "dados_loja_publicos não devolveu a loja");
    assert.ok(!("margem_padrao" in loja), "a margem da loja vazou");
    assert.deepEqual(Object.keys(loja).sort(), [
      "endereco",
      "horario",
      "logo_url",
      "nome",
      "telefone",
    ]);
  });

  test("serviços da landing saem sem preço", async () => {
    const { data, error } = await anonimo!.rpc("servicos_publicos");
    assert.equal(error, null);

    for (const servico of (data as Record<string, unknown>[] | null) ?? []) {
      assert.ok(!("valor_padrao" in servico), "o preço do serviço vazou");
      assert.deepEqual(Object.keys(servico).sort(), ["categoria", "nome"]);
    }
  });
});
