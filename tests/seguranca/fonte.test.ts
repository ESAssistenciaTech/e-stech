import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Invariantes de segurança lidas do próprio código-fonte.
 *
 * Não tocam a rede e não precisam de dado nenhum: valem em máquina zerada e
 * no CI. São as regras do AGENTS.md transformadas em teste — cada uma delas
 * já custou caro uma vez, ou custaria na primeira vez que fosse quebrada.
 */

const RAIZ = new URL("../../", import.meta.url);

function ler(caminho: string) {
  return readFileSync(fileURLToPath(new URL(caminho, RAIZ)), "utf8");
}

const MIGRACOES = readdirSync(fileURLToPath(new URL("supabase/migrations", RAIZ)))
  .filter((nome) => nome.endsWith(".sql"))
  .map((nome) => ({ nome, sql: ler(`supabase/migrations/${nome}`) }));

/** Comentário fala de `custo_peca`; código usa. O teste só se importa com o segundo. */
function semComentarioSQL(sql: string) {
  return sql.replace(/--[^\n]*/g, "");
}

function semComentarioTS(fonte: string) {
  return fonte.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

/** Corpo de cada `create function`, do cabeçalho ao `$$;` que o fecha. */
function funcoes(sql: string) {
  return sql.match(/create\s+(or\s+replace\s+)?function[\s\S]*?\$\$\s*;/gi) ?? [];
}

/** Nomes das colunas de um `returns table (...)`. */
function colunasRetornadas(definicao: string) {
  const bloco = definicao.match(/returns\s+table\s*\(([\s\S]*?)\)\s*language/i);
  assert.ok(bloco, "função sem bloco returns table");
  return bloco[1]
    .split(",")
    .map((linha) => linha.trim().split(/\s+/)[0])
    .filter(Boolean);
}

function acharFuncao(nome: string) {
  for (const { sql } of MIGRACOES) {
    for (const definicao of funcoes(sql)) {
      if (new RegExp(`function\\s+${nome}\\s*\\(`, "i").test(definicao)) {
        return semComentarioSQL(definicao);
      }
    }
  }
  assert.fail(`função ${nome} não encontrada nas migrations`);
}

describe("migrations", () => {
  /**
   * Já vazou uma vez: view sem isso roda com privilégio do dono e ignora o
   * RLS das tabelas de baixo — valores e lucro ficaram legíveis por anônimo.
   */
  test("toda view nasce com security_invoker = on", () => {
    for (const { nome, sql } of MIGRACOES) {
      const criacoes =
        semComentarioSQL(sql).match(/create\s+(or\s+replace\s+)?view[\s\S]*?\bas\b/gi) ?? [];

      for (const criacao of criacoes) {
        assert.ok(
          /security_invoker\s*=\s*on/i.test(criacao),
          `${nome}: view criada sem security_invoker = on`,
        );
      }
    }
  });

  /**
   * Sem search_path fixo dá para sequestrar uma função security definer
   * criando objeto de mesmo nome em outro schema.
   */
  test("toda função security definer fixa o search_path", () => {
    for (const { nome, sql } of MIGRACOES) {
      for (const definicao of funcoes(semComentarioSQL(sql))) {
        if (!/security\s+definer/i.test(definicao)) continue;
        assert.ok(
          /set\s+search_path\s*=/i.test(definicao),
          `${nome}: função security definer sem search_path fixo`,
        );
      }
    }
  });

  /**
   * O acesso público vem por função dedicada, campo a campo. Uma policy de
   * leitura anônima significaria confiar que toda consulta futura vai lembrar
   * de filtrar coluna — e uma hora não lembra.
   */
  test("nenhuma tabela sensível ganha policy para anon", () => {
    const SENSIVEIS = [
      "ordens_servico",
      "clientes",
      "os_servicos",
      "movimentacoes_caixa",
      "os_fotos",
      "cotacoes",
      "dados_loja",
      "tipos_servico",
      "insumos",
      "aparelhos_doadores",
    ];

    for (const { nome, sql } of MIGRACOES) {
      const policies = semComentarioSQL(sql).match(/create\s+policy[\s\S]*?;/gi) ?? [];

      for (const policy of policies) {
        if (!/\bto\s+[^;]*\banon\b/i.test(policy)) continue;
        for (const tabela of SENSIVEIS) {
          assert.ok(
            !new RegExp(`\\bon\\s+${tabela}\\b`, "i").test(policy),
            `${nome}: policy para anon em ${tabela}`,
          );
        }
      }
    }
  });
});

describe("consultar_os — a única porta anônima", () => {
  const definicao = acharFuncao("consultar_os");

  test("devolve exatamente os sete campos públicos", () => {
    assert.deepEqual(colunasRetornadas(definicao).sort(), [
      "aparelho",
      "codigo_publico",
      "data_conclusao",
      "data_entrada",
      "data_entrega",
      "servicos",
      "status",
    ]);
  });

  test("não encosta em senha, custo, valor nem dado de cliente", () => {
    for (const proibido of [
      "senha_aparelho",
      "custo_peca",
      "valor_peca",
      "cliente_id",
      "cpf",
    ]) {
      assert.ok(
        !definicao.includes(proibido),
        `consultar_os menciona ${proibido}`,
      );
    }
  });
});

describe("funções públicas de apoio", () => {
  test("dados_loja_publicos não expõe a margem da loja", () => {
    const definicao = acharFuncao("dados_loja_publicos");
    assert.ok(!colunasRetornadas(definicao).includes("margem_padrao"));
    assert.ok(!definicao.includes("margem_padrao"));
  });

  test("servicos_publicos não expõe preço", () => {
    const definicao = acharFuncao("servicos_publicos");
    assert.ok(!colunasRetornadas(definicao).includes("valor_padrao"));
    assert.ok(!definicao.includes("valor_padrao"));
  });
});

describe("telas que o cliente vê", () => {
  /**
   * O comprovante é entregue na mão do cliente. Senha do aparelho e custo da
   * peça não vão para o papel — o cliente já sabe a senha dele, e a margem é
   * da loja.
   */
  test("o comprovante não imprime senha do aparelho nem custo de peça", () => {
    const fonte = semComentarioTS(
      ler("app/(admin)/os/[id]/comprovante/page.tsx"),
    );

    assert.ok(!fonte.includes("senha_aparelho"));
    assert.ok(!fonte.includes("senha_tipo"));
    assert.ok(!fonte.includes("custo_peca"));
  });

  /** Nenhuma página pública consulta a tabela protegida direto. */
  test("o portal público passa por função, não pela tabela", () => {
    const fonte = semComentarioTS(
      ler("app/(public)/acompanhar/[codigo]/page.tsx"),
    );

    assert.ok(!fonte.includes('from("ordens_servico")'));
    assert.ok(!fonte.includes('from("clientes")'));
    assert.ok(!fonte.includes('from("ordens_servico_totais")'));
  });

  test("a landing não consulta tabela protegida", () => {
    const fonte = semComentarioTS(ler("app/page.tsx"));

    assert.ok(!fonte.includes('from("tipos_servico")'));
    assert.ok(!fonte.includes('from("dados_loja")'));
    assert.ok(!fonte.includes('from("ordens_servico")'));
  });
});
