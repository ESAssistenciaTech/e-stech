import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { codigo, data, moeda } from "@/lib/formato";
import {
  ROTULO_PERIODO,
  PERIODOS,
  ehPeriodo,
  intervalo,
  type Periodo,
} from "@/lib/periodo";
import { apurar, porServico, type LinhaLucro } from "@/lib/relatorio";

type Params = { searchParams: Promise<{ periodo?: string }> };

/**
 * Lucro apurado.
 *
 * Conta a OS quando ela é **entregue**, não quando o dinheiro entra: o
 * Caixa já mostra dinheiro. Uma OS entregue fiado deu lucro, e uma OS paga
 * adiantada que ainda está na bancada não deu — separar as duas coisas é o
 * que faz este número servir para decidir preço.
 *
 * Tela inteiramente interna: mostra custo de peça e margem. Não linkar do
 * portal, não imprimir.
 */
export default async function LucroPage({ searchParams }: Params) {
  const { periodo: bruto } = await searchParams;
  const periodo: Periodo = ehPeriodo(bruto) ? bruto : "mes";
  const { inicio, fim } = intervalo(periodo);

  const supabase = await createClient();

  let consultaOrdens = supabase
    .from("ordens_servico_totais")
    .select(
      "id, numero, codigo_publico, valor_mao_obra, valor_total, custo_peca, lucro, data_entrega",
    )
    .eq("status", "entregue")
    .order("lucro", { ascending: false })
    .limit(200);

  // Mão de obra por tipo de serviço. O filtro cai na OS, não no serviço —
  // daí o !inner: sem ele o join é externo e o filtro não corta linha nenhuma.
  let consultaServicos = supabase
    .from("os_servicos")
    .select("valor, tipos_servico!inner(nome), ordens_servico!inner(status)")
    .eq("ordens_servico.status", "entregue")
    .limit(2000);

  if (inicio && fim) {
    consultaOrdens = consultaOrdens.gte("data_entrega", inicio).lt("data_entrega", fim);
    consultaServicos = consultaServicos
      .gte("ordens_servico.data_entrega", inicio)
      .lt("ordens_servico.data_entrega", fim);
  }

  const [{ data: ordens }, { data: servicos }, { count: semData }] =
    await Promise.all([
      consultaOrdens,
      consultaServicos,
      // Entregue sem data de entrega não cai em período nenhum. O gatilho da
      // migração 0011 fecha a torneira, mas linha antiga continua lá — e
      // lucro que some sem aviso é pior que lucro errado.
      supabase
        .from("ordens_servico")
        .select("id", { count: "exact", head: true })
        .eq("status", "entregue")
        .is("data_entrega", null),
    ]);

  const linhas = (ordens ?? []) as unknown as LinhaLucro[];
  const total = apurar(linhas);

  const listaServicos = porServico(
    ((servicos ?? []) as unknown as {
      valor: number;
      tipos_servico: { nome: string };
    }[]).map((s) => ({ nome: s.tipos_servico.nome, valor: s.valor })),
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <h1 className="font-display text-3xl font-bold tracking-tight text-navy">
        Lucro
      </h1>

      <div className="-mx-4 -mt-2 flex gap-2 overflow-x-auto px-4 pb-1">
        {PERIODOS.map((p) => (
          <Link
            key={p}
            href={p === "mes" ? "/lucro" : `/lucro?periodo=${p}`}
            aria-current={p === periodo ? "page" : undefined}
            className={`shrink-0 rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
              p === periodo
                ? "border-navy bg-navy text-white"
                : "border-line bg-white text-mute"
            }`}
          >
            {ROTULO_PERIODO[p]}
          </Link>
        ))}
      </div>

      {total.quantidade === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-white px-6 py-12 text-center">
          <p className="mb-1 font-display text-lg font-semibold text-navy">
            Nada apurado
          </p>
          <p className="text-sm text-mute">
            Nenhuma OS entregue neste período. O lucro entra quando o aparelho
            sai.
          </p>
        </div>
      ) : (
        <>
          <section>
            <p className="text-sm font-medium text-mute">Lucro apurado</p>
            <p className="dado text-5xl font-bold leading-none tracking-tight text-navy">
              {moeda(total.lucro)}
            </p>
            <p className="mt-2 text-sm text-mute">
              {total.quantidade === 1
                ? "1 ordem entregue"
                : `${total.quantidade} ordens entregues`}{" "}
              · faturou{" "}
              <span className="dado">{moeda(total.faturamento)}</span>
            </p>
          </section>

          {/* De onde o número saiu. Total sozinho é número que não se confere. */}
          <section className="rounded-xl border border-line bg-white">
            {[
              { rotulo: "Mão de obra", valor: total.maoObra },
              { rotulo: "Peça vendida", valor: total.vendaPeca },
              { rotulo: "Custo da peça", valor: -total.custoPeca },
            ].map((linha, i) => (
              <div
                key={linha.rotulo}
                className={`flex min-h-12 items-center gap-3 px-4 ${
                  i > 0 ? "border-t border-line" : ""
                }`}
              >
                <span className="min-w-0 flex-1 truncate text-sm">
                  {linha.rotulo}
                </span>
                <span
                  className={`dado font-semibold ${
                    linha.valor < 0 ? "text-status-recusado" : "text-ink"
                  }`}
                >
                  {moeda(linha.valor)}
                </span>
              </div>
            ))}
            <div className="flex min-h-12 items-center gap-3 border-t-2 border-navy/15 px-4">
              <span className="min-w-0 flex-1 truncate font-display font-semibold text-navy">
                Lucro
              </span>
              <span className="dado font-bold text-navy">
                {moeda(total.lucro)}
              </span>
            </div>
          </section>

          {total.semCusto > 0 && (
            <p className="rounded-xl border border-line bg-white p-4 text-sm text-mute">
              {total.semCusto === 1
                ? "1 ordem cobrou peça sem custo registrado"
                : `${total.semCusto} ordens cobraram peça sem custo registrado`}
              . O lucro delas está inflado — o custo entra na edição da OS.
            </p>
          )}

          <section>
            <h2 className="mb-1 font-display text-lg font-semibold text-navy">
              Mão de obra por serviço
            </h2>
            <p className="mb-3 text-sm text-mute">
              Só mão de obra, não lucro: o custo da peça é da OS inteira, e
              numa OS com dois serviços não há como dizer de qual ele é.
            </p>

            <ul className="rounded-xl border border-line bg-white">
              {listaServicos.map((s, i) => (
                <li
                  key={s.nome}
                  className={`flex min-h-12 items-center gap-3 px-4 ${
                    i > 0 ? "border-t border-line" : ""
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {s.nome}
                  </span>
                  <span className="dado shrink-0 text-sm text-mute">
                    {s.quantidade}×
                  </span>
                  <span className="dado shrink-0 font-semibold text-ink">
                    {moeda(s.valor)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold text-navy">
              Por ordem
            </h2>
            <ul className="flex flex-col gap-2">
              {linhas.map((os) => (
                <li key={os.id}>
                  <Link
                    href={`/os/${os.id}`}
                    className="flex min-h-14 items-center gap-3 rounded-lg border border-line bg-white px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="dado truncate font-medium text-navy">
                        {codigo(os.codigo_publico)}
                      </p>
                      <p className="dado truncate text-xs text-mute">
                        {data(os.data_entrega)} · faturou{" "}
                        {moeda(Number(os.valor_total))}
                      </p>
                    </div>
                    <span
                      className={`dado shrink-0 font-semibold ${
                        Number(os.lucro) < 0 ? "text-status-recusado" : "text-ink"
                      }`}
                    >
                      {moeda(Number(os.lucro))}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {linhas.length === 200 && (
              <p className="mt-2 px-1 text-xs text-mute">
                Mostrando as 200 de maior lucro. Para o histórico inteiro, o
                CSV de ordens em Ajustes.
              </p>
            )}
          </section>
        </>
      )}

      {semData !== null && semData > 0 && (
        <p className="rounded-xl border border-line bg-white p-4 text-sm text-mute">
          {semData === 1
            ? "1 ordem está entregue sem data de entrega"
            : `${semData} ordens estão entregues sem data de entrega`}
          . Elas não caem em nenhum mês e só aparecem em Tudo.
        </p>
      )}

      <p className="px-1 pb-2 text-sm text-mute">
        Conta por entrega, não por caixa: o lucro entra quando o aparelho sai,
        mesmo que o cliente ainda deva. Dinheiro que entrou está no{" "}
        <Link href="/financeiro" className="text-cyan-deep">
          Caixa
        </Link>
        . Aluguel, luz e demais despesas não estão descontados aqui — isto é o
        resultado do serviço, não o do mês.
      </p>
    </div>
  );
}
