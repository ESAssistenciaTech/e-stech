import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MARCA, entrar, semCredenciais, motivo, varrer } from "./sessao.mts";

/**
 * O caminho autenticado, contra o banco de verdade.
 *
 * É onde mora a conta do dinheiro. Os testes de unidade provam que `apurar`
 * soma direito; estes provam que a view que alimenta `apurar` calcula direito,
 * que os gatilhos disparam e que `comprar_insumos` faz as duas coisas ou
 * nenhuma. Nada disso é verificável sem sessão.
 */
describe("dados autenticados", { skip: semCredenciais ? motivo : false }, () => {
  let supabase: SupabaseClient;

  before(async () => {
    supabase = await entrar();
    await varrer(supabase);
  });

  after(async () => {
    if (supabase) await varrer(supabase);
  });

  /** Cria o mínimo para existir uma OS: cliente e um tipo de serviço. */
  async function cenario() {
    const { data: cliente } = await supabase
      .from("clientes")
      .insert({ nome: `${MARCA}cliente` })
      .select("id")
      .single();

    const { data: tipo } = await supabase
      .from("tipos_servico")
      .insert({
        nome: `${MARCA}servico`,
        categoria: "celular",
        valor_padrao: 150,
        garantia_dias_padrao: 90,
      })
      .select("id")
      .single();

    assert.ok(cliente && tipo, "não deu para montar o cenário");
    return { clienteId: cliente.id as string, tipoId: tipo.id as string };
  }

  test("autenticado enxerga o que anônimo não enxerga", async () => {
    const { error } = await supabase.from("ordens_servico").select("id").limit(1);
    assert.equal(error, null, "sessão não abriu a tabela protegida");
  });

  /**
   * A conta que o sistema inteiro repete. Se esta view escorregar, o painel,
   * o comprovante, o "a receber" e o relatório de lucro escorregam juntos —
   * e nenhum deles tem como perceber sozinho.
   */
  test("a view de totais fecha a conta", async () => {
    const { clienteId, tipoId } = await cenario();

    const { data: os } = await supabase
      .from("ordens_servico")
      .insert({
        cliente_id: clienteId,
        solicitacao: `${MARCA}troca de tela`,
        valor_peca: 300,
        custo_peca: 180,
      })
      .select("id")
      .single();

    assert.ok(os);

    await supabase.from("os_servicos").insert({
      ordem_servico_id: os.id,
      tipo_servico_id: tipoId,
      valor: 150,
      garantia_dias: 90,
    });

    await supabase.from("movimentacoes_caixa").insert({
      tipo: "entrada",
      categoria: "servico",
      descricao: `${MARCA}sinal`,
      valor: 200,
      ordem_servico_id: os.id,
    });

    const { data: totais } = await supabase
      .from("ordens_servico_totais")
      .select("*")
      .eq("id", os.id)
      .single();

    assert.ok(totais);
    assert.equal(Number(totais.valor_mao_obra), 150);
    // peça 300 + mão de obra 150
    assert.equal(Number(totais.valor_total), 450);
    assert.equal(Number(totais.valor_pago), 200);
    assert.equal(Number(totais.saldo), 250);
    // 450 de faturamento menos 180 de custo da peça
    assert.equal(Number(totais.lucro), 270);
  });

  /**
   * O gatilho da migração 0011. Antes dele, OS resolvida na hora e aberta já
   * como entregue ficava sem data e sumia do relatório de lucro em silêncio.
   */
  test("OS aberta já como entregue ganha data de entrega", async () => {
    const { clienteId } = await cenario();

    const { data: os } = await supabase
      .from("ordens_servico")
      .insert({
        cliente_id: clienteId,
        solicitacao: `${MARCA}resolvido no balcão`,
        status: "entregue",
      })
      .select("data_entrega")
      .single();

    assert.ok(os);
    assert.notEqual(
      os.data_entrega,
      null,
      "entregue sem data de entrega: não cai em mês nenhum",
    );
  });

  test("OS entregue com foto e garantia vencida aparece na limpeza", async () => {
    const { clienteId } = await cenario();

    const ontem = new Date(Date.now() - 86_400_000).toISOString();
    const { data: os } = await supabase
      .from("ordens_servico")
      .insert({
        cliente_id: clienteId,
        solicitacao: `${MARCA}com foto`,
        status: "entregue",
        data_entrega: ontem,
      })
      .select("id")
      .single();

    assert.ok(os);

    // Sem serviço nenhum a garantia é zero: venceu na entrega.
    await supabase.from("os_fotos").insert({
      ordem_servico_id: os.id,
      momento: "entrada",
      url: "https://example.invalid/x.jpg",
      public_id: `${MARCA}sem-arquivo`,
      bytes: 123_456,
    });

    const { data: linha } = await supabase
      .from("os_fotos_limpeza")
      .select("*")
      .eq("id", os.id)
      .single();

    assert.ok(linha, "OS com foto e garantia vencida não apareceu");
    assert.equal(linha.fotos, 1);
    assert.equal(Number(linha.bytes), 123_456);
    assert.ok(new Date(linha.garantia_ate).getTime() < Date.now());
  });

  /**
   * A promessa do CONTEXT.md: sobe a quantidade E lança no caixa, no mesmo
   * ato. Testar só um dos lados deixaria passar exatamente o caso que a
   * função existe para evitar.
   */
  describe("comprar_insumos", () => {
    async function insumo(quantidade: number) {
      const { data } = await supabase
        .from("insumos")
        .insert({
          nome: `${MARCA}pelicula`,
          quantidade,
          precisa_repor: true,
        })
        .select("id")
        .single();
      assert.ok(data);
      return data.id as string;
    }

    test("sobe a quantidade, tira da lista e lança a saída", async () => {
      const id = await insumo(2);

      const { error } = await supabase.rpc("comprar_insumos", {
        itens: [{ id, quantidade: 5 }],
        valor: 80,
        forma: "pix",
        observacao: `${MARCA}compra`,
      });
      assert.equal(error, null);

      const { data: depois } = await supabase
        .from("insumos")
        .select("quantidade, precisa_repor")
        .eq("id", id)
        .single();

      assert.equal(depois!.quantidade, 7);
      assert.equal(depois!.precisa_repor, false);

      const { data: caixa } = await supabase
        .from("movimentacoes_caixa")
        .select("tipo, categoria, valor, forma_pagamento")
        .eq("descricao", `${MARCA}compra`);

      assert.equal(caixa?.length, 1, "a compra não chegou ao caixa");
      assert.equal(caixa![0].tipo, "saida");
      assert.equal(caixa![0].categoria, "compra_insumo");
      assert.equal(Number(caixa![0].valor), 80);
      assert.equal(caixa![0].forma_pagamento, "pix");
    });

    test("valor zero não passa, e não mexe na quantidade", async () => {
      const id = await insumo(3);

      const { error } = await supabase.rpc("comprar_insumos", {
        itens: [{ id, quantidade: 5 }],
        valor: 0,
        forma: "dinheiro",
      });

      assert.ok(error, "compra sem valor foi aceita");

      const { data: depois } = await supabase
        .from("insumos")
        .select("quantidade")
        .eq("id", id)
        .single();

      // A quantidade subir com o caixa recusando é o pior dos dois mundos.
      assert.equal(depois!.quantidade, 3);
    });

    test("compra sem quantidade nenhuma é recusada", async () => {
      const id = await insumo(1);

      const { error } = await supabase.rpc("comprar_insumos", {
        itens: [{ id, quantidade: 0 }],
        valor: 50,
        forma: "dinheiro",
      });

      assert.ok(error, "compra vazia gerou saída no caixa");
    });
  });
});
