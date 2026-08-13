import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Etiqueta } from "@/components/etiqueta";
import { moeda, telefone } from "@/lib/formato";
import { STATUS_ABERTOS, type Cliente, type StatusOS } from "@/lib/tipos";
import { apagarCliente } from "../actions";

const bloco = "rounded-xl border border-line bg-white p-4";

type Params = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
};

export default async function ClientePage({ params, searchParams }: Params) {
  const { id } = await params;
  const { erro } = await searchParams;
  const supabase = await createClient();

  const [{ data: cliente }, { data: ordens }, { data: totais }] =
    await Promise.all([
      supabase.from("clientes").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("ordens_servico")
        .select(
          "id, numero, codigo_publico, status, aparelho_marca, aparelho_modelo, marca_nao_identificada, modelo_nao_identificado, data_entrada, atualizado_em",
        )
        .eq("cliente_id", id)
        .order("data_entrada", { ascending: false }),
      supabase
        .from("ordens_servico_totais")
        .select("valor_total, saldo, status")
        .eq("cliente_id", id),
    ]);

  if (!cliente) notFound();

  const c = cliente as Cliente;
  const gastoTotal = (totais ?? [])
    .filter((t) => t.status === "entregue")
    .reduce((soma, t) => soma + Number(t.valor_total), 0);
  const devendo = (totais ?? []).reduce((soma, t) => soma + Number(t.saldo), 0);
  const abertas = (ordens ?? []).filter((o) =>
    STATUS_ABERTOS.includes(o.status as StatusOS),
  ).length;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link href="/clientes" className="text-sm font-medium text-cyan-deep">
        ← Clientes
      </Link>

      <header className={bloco}>
        <h1 className="font-display text-2xl font-bold text-navy">{c.nome}</h1>
        <dl className="mt-2 flex flex-col gap-1 text-sm">
          {c.telefone && (
            <div className="flex gap-2">
              <dt className="text-mute">Telefone</dt>
              <dd className="dado">{telefone(c.telefone)}</dd>
            </div>
          )}
          {c.cpf && (
            <div className="flex gap-2">
              <dt className="text-mute">CPF</dt>
              <dd className="dado">{c.cpf}</dd>
            </div>
          )}
          {c.email && (
            <div className="flex gap-2">
              <dt className="text-mute">Email</dt>
              <dd className="truncate">{c.email}</dd>
            </div>
          )}
        </dl>
        {c.observacoes && (
          <p className="mt-3 whitespace-pre-wrap border-t border-line pt-3 text-sm text-ink">
            {c.observacoes}
          </p>
        )}
      </header>

      {erro === "tem-os" && (
        <p role="alert" className={`${bloco} text-sm text-status-recusado`}>
          Esse cliente tem ordens de serviço. Apagar levaria o histórico junto —
          o banco não deixa. Apague as OS primeiro, se for mesmo o caso.
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        <div className={bloco}>
          <p className="text-xs text-mute">Na bancada</p>
          <p className="dado text-xl font-bold text-navy">{abertas}</p>
        </div>
        <div className={bloco}>
          <p className="text-xs text-mute">Já gastou</p>
          <p className="dado text-xl font-bold text-navy">{moeda(gastoTotal)}</p>
        </div>
        <div className={bloco}>
          <p className="text-xs text-mute">Deve</p>
          <p
            className={`dado text-xl font-bold ${devendo > 0 ? "text-amber" : "text-navy"}`}
          >
            {moeda(devendo)}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          href={`/clientes/${c.id}/editar`}
          className="flex h-12 flex-1 items-center justify-center rounded-lg border border-line font-medium text-navy"
        >
          Editar
        </Link>
        <Link
          href="/os/nova"
          className="flex h-12 flex-[2] items-center justify-center rounded-lg bg-cyan-deep font-display font-semibold text-white hover:bg-navy"
        >
          Nova OS
        </Link>
      </div>

      <section>
        <h2 className="mb-2 font-display text-lg font-semibold text-navy">
          Histórico
        </h2>
        {!ordens || ordens.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-white p-6 text-center text-mute">
            Nenhuma OS ainda.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {ordens.map((os) => (
              <li key={os.id}>
                <Etiqueta
                  id={os.id}
                  codigoPublico={os.codigo_publico}
                  status={os.status as StatusOS}
                  aparelho={
                    [
                      os.marca_nao_identificada
                        ? "marca não identificada"
                        : os.aparelho_marca,
                      os.modelo_nao_identificado
                        ? "modelo não identificado"
                        : os.aparelho_modelo,
                    ]
                      .filter(Boolean)
                      .join(" ") || null
                  }
                  cliente={c.nome}
                  dataEntrada={os.data_entrada}
                  atualizadoEm={os.atualizado_em}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {(!ordens || ordens.length === 0) && (
        <form action={apagarCliente} className="pt-2">
          <input type="hidden" name="id" value={c.id} />
          <button
            type="submit"
            className="h-11 w-full rounded-lg border border-status-recusado/40 text-sm font-medium text-status-recusado"
          >
            Apagar cliente
          </button>
        </form>
      )}
    </div>
  );
}
