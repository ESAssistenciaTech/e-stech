import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { moeda, telefone } from "@/lib/formato";
import { comMargem, idadeCotacao, type UltimaCotacao } from "@/lib/cotacao";

type Params = { searchParams: Promise<{ q?: string; peca?: string }> };

export default async function CotacoesPage({ searchParams }: Params) {
  const { q, peca } = await searchParams;
  const busca = (q ?? "").trim();
  const supabase = await createClient();

  const [{ data: loja }, { data: pecas }] = await Promise.all([
    supabase
      .from("dados_loja")
      .select("margem_padrao")
      .eq("singleton", true)
      .maybeSingle(),
    busca.length >= 2
      ? supabase
          .from("pecas")
          .select("*")
          .ilike("nome", `%${busca}%`)
          .order("nome")
          .limit(20)
      : peca
        ? supabase.from("pecas").select("*").eq("id", peca)
        : supabase
            .from("pecas")
            .select("*")
            .order("criado_em", { ascending: false })
            .limit(10),
  ]);

  const margem = Number(loja?.margem_padrao ?? 30);
  const idsPecas = (pecas ?? []).map((p) => p.id);

  const { data: cotacoes } = idsPecas.length
    ? await supabase
        .from("ultimas_cotacoes")
        .select("*")
        .in("peca_id", idsPecas)
    : { data: [] };

  // Agrupa por peça e depois por qualidade: é assim que a pergunta chega —
  // "quanto é a tela do iPhone 12?" e só depois "qual qualidade?".
  const porPeca = new Map<string, Map<string, UltimaCotacao[]>>();
  for (const c of (cotacoes ?? []) as UltimaCotacao[]) {
    const daPeca = porPeca.get(c.peca_id) ?? new Map();
    const daQualidade = daPeca.get(c.qualidade_nome) ?? [];
    daQualidade.push(c);
    daPeca.set(c.qualidade_nome, daQualidade);
    porPeca.set(c.peca_id, daPeca);
  }

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <header className="mb-4 flex items-center gap-3">
        <h1 className="font-display text-3xl font-bold tracking-tight text-navy">
          Cotações
        </h1>
        {/* Antes de perguntar preço ao fornecedor, a pergunta é se a peça já
            está na gaveta. Por isso Doadores fica no mesmo cabeçalho. */}
        <Link
          href="/doadores"
          className="ml-auto text-sm font-medium text-cyan-deep"
        >
          Doadores
        </Link>
        <Link
          href="/fornecedores"
          className="text-sm font-medium text-cyan-deep"
        >
          Fornecedores
        </Link>
      </header>

      <form className="mb-4 flex gap-2">
        <input
          name="q"
          defaultValue={busca}
          placeholder="Que peça o cliente pediu?"
          className="h-12 min-w-0 flex-1 rounded-lg border border-line bg-white px-3 text-base outline-none focus:border-cyan-deep"
        />
        <button
          type="submit"
          className="h-12 shrink-0 rounded-lg border border-line px-4 font-medium text-navy"
        >
          Buscar
        </button>
      </form>

      {(pecas ?? []).length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-white px-6 py-12 text-center">
          <p className="mb-1 font-display text-lg font-semibold text-navy">
            {busca ? "Nunca cotei essa peça" : "Nenhuma cotação ainda"}
          </p>
          <p className="mb-5 text-sm text-mute">
            {busca
              ? "Pergunte aos fornecedores e registre os preços — na próxima vez você já chega com um número."
              : "Registre a primeira consulta que fizer aos fornecedores."}
          </p>
          <Link
            href="/cotacoes/nova"
            className="inline-flex h-12 items-center rounded-lg bg-cyan-deep px-5 font-display font-semibold text-white"
          >
            Registrar cotação
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {(pecas ?? []).map((p) => {
            const daPeca = porPeca.get(p.id);
            return (
              <li
                key={p.id}
                className="overflow-hidden rounded-xl border border-line bg-white"
              >
                <div className="border-b border-line px-4 py-3">
                  <p className="font-display text-lg font-semibold text-navy">
                    {p.nome}
                  </p>
                  {p.modelo_compativel && (
                    <p className="text-sm text-mute">{p.modelo_compativel}</p>
                  )}
                </div>

                {!daPeca ? (
                  <p className="px-4 py-4 text-sm text-mute">
                    Cadastrada, mas sem preço registrado.
                  </p>
                ) : (
                  [...daPeca.entries()]
                    .sort(
                      (a, b) => a[1][0].qualidade_ordem - b[1][0].qualidade_ordem,
                    )
                    .map(([qualidade, lista]) => {
                      const barato = [...lista].sort(
                        (x, y) => Number(x.preco) - Number(y.preco),
                      )[0];
                      return (
                        <div
                          key={qualidade}
                          className="border-b border-line px-4 py-3 last:border-0"
                        >
                          <div className="mb-1 flex items-baseline gap-2">
                            <span className="text-sm font-semibold text-ink">
                              {qualidade}
                            </span>
                            <span className="dado ml-auto text-lg font-bold text-navy">
                              {moeda(comMargem(Number(barato.preco), margem))}
                            </span>
                          </div>
                          <p className="mb-2 text-xs text-mute">
                            preço a dizer pro cliente, com {margem}% de margem
                            sobre o mais barato
                          </p>

                          <ul className="flex flex-col gap-1">
                            {lista
                              .sort((x, y) => Number(x.preco) - Number(y.preco))
                              .map((c) => {
                                const idade = idadeCotacao(c.data);
                                return (
                                  <li
                                    key={c.id}
                                    className="flex items-baseline gap-2 text-sm"
                                  >
                                    <span className="min-w-0 flex-1 truncate text-mute">
                                      {c.fornecedor_nome}
                                    </span>
                                    <span
                                      className={`dado text-xs ${idade.velha ? "text-amber" : "text-mute"}`}
                                    >
                                      {idade.texto}
                                    </span>
                                    <span className="dado font-medium">
                                      {moeda(c.preco)}
                                    </span>
                                  </li>
                                );
                              })}
                          </ul>
                        </div>
                      );
                    })
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="nao-imprimir fixed inset-x-0 bottom-16 z-10 px-4 pb-3">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/cotacoes/nova"
            className="flex h-14 items-center justify-center gap-2 rounded-xl bg-cyan-deep font-display text-base font-semibold text-white shadow-lg shadow-navy/20"
          >
            Registrar cotação
          </Link>
        </div>
      </div>
    </div>
  );
}
