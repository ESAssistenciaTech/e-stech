import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { dataHora, moeda } from "@/lib/formato";
import { ROTULO_CATEGORIA, ROTULO_FORMA, type Movimentacao } from "@/lib/caixa";
import { inicioDoMes } from "@/lib/periodo";
import { FormularioMovimentacao } from "./formulario";

export default async function FinanceiroPage() {
  const supabase = await createClient();

  const [{ data: doMes }, { data: recentes }] = await Promise.all([
    supabase
      .from("movimentacoes_caixa")
      .select("tipo, valor")
      .gte("data", inicioDoMes()),
    supabase
      .from("movimentacoes_caixa")
      .select("*, ordens_servico(codigo_publico)")
      .order("data", { ascending: false })
      .limit(50),
  ]);

  let entrou = 0;
  let saiu = 0;
  for (const m of doMes ?? []) {
    if (m.tipo === "entrada") entrou += Number(m.valor);
    else saiu += Number(m.valor);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="font-display text-2xl font-bold text-navy">Caixa</h1>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-line bg-white p-3">
          <p className="text-xs text-mute">Entrou</p>
          <p className="dado text-lg font-bold text-status-pronto">
            {moeda(entrou)}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-white p-3">
          <p className="text-xs text-mute">Saiu</p>
          <p className="dado text-lg font-bold text-status-recusado">
            {moeda(saiu)}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-white p-3">
          <p className="text-xs text-mute">Saldo</p>
          <p className="dado text-lg font-bold text-navy">{moeda(entrou - saiu)}</p>
        </div>
      </div>
      <p className="-mt-2 px-1 text-xs text-mute">No mês corrente.</p>

      {/* Caixa é dinheiro que entrou; lucro é resultado apurado. São duas
          perguntas diferentes, e é aqui que a segunda costuma ser feita. */}
      <Link
        href="/lucro"
        className="flex min-h-14 items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 hover:border-cyan-deep"
      >
        <div className="min-w-0 flex-1">
          <p className="font-medium text-ink">Lucro</p>
          <p className="text-xs text-mute">
            Quanto sobrou depois do custo da peça, por período e por serviço.
          </p>
        </div>
        <span aria-hidden className="shrink-0 text-mute">
          →
        </span>
      </Link>

      <FormularioMovimentacao />

      <section>
        <h2 className="mb-2 font-display text-lg font-semibold text-navy">
          Últimas movimentações
        </h2>

        {!recentes || recentes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-white p-8 text-center text-mute">
            Nada registrado ainda.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {(recentes as unknown as (Movimentacao & {
              ordens_servico: { codigo_publico: string } | null;
            })[]).map((m) => {
              const entrada = m.tipo === "entrada";
              return (
                <li
                  key={m.id}
                  className="flex items-center gap-3 rounded-lg border border-line bg-white px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">
                      {ROTULO_CATEGORIA[m.categoria] ?? m.categoria}
                      {m.descricao && (
                        <span className="font-normal text-mute"> · {m.descricao}</span>
                      )}
                    </p>
                    <p className="dado truncate text-xs text-mute">
                      {dataHora(m.data)} · {ROTULO_FORMA[m.forma_pagamento]}
                      {m.ordens_servico && (
                        <>
                          {" · "}
                          <Link
                            href={`/os/${m.ordem_servico_id}`}
                            className="text-cyan-deep"
                          >
                            {m.ordens_servico.codigo_publico}
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                  <span
                    className={`dado shrink-0 font-semibold ${
                      entrada ? "text-status-pronto" : "text-status-recusado"
                    }`}
                  >
                    {entrada ? "+" : "−"} {moeda(m.valor)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
