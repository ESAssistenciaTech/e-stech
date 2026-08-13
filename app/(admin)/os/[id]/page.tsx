import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { codigo, dataHora, moeda, telefone } from "@/lib/formato";
import { ROTULO_SENHA, STATUS, type StatusOS, type TipoSenha } from "@/lib/tipos";
import { SeletorStatus } from "./seletor-status";
import { RegistrarPagamento } from "@/components/registrar-pagamento";

const bloco = "rounded-xl border border-line bg-white p-4";

export default async function DetalheOSPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: os }, { data: totais }, { data: servicos }] = await Promise.all([
    supabase
      .from("ordens_servico")
      .select("*, clientes(id, nome, telefone)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("ordens_servico_totais").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("os_servicos")
      .select("id, valor, garantia_dias, tipos_servico(nome)")
      .eq("ordem_servico_id", id),
  ]);

  if (!os) notFound();

  const cliente = os.clientes as unknown as {
    id: string;
    nome: string;
    telefone: string | null;
  } | null;
  const status = os.status as StatusOS;
  // Marca e modelo que não deu pra identificar aparecem como tal, e não como
  // campo vazio: a diferença é o que protege a loja depois.
  const aparelho = [
    os.marca_nao_identificada ? "marca não identificada" : os.aparelho_marca,
    os.modelo_nao_identificado ? "modelo não identificado" : os.aparelho_modelo,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link href="/os" className="text-sm font-medium text-cyan-deep">
          ← Ordens
        </Link>
        <Link
          href={`/os/${os.id}/comprovante`}
          className="ml-auto flex h-10 items-center rounded-lg border border-line bg-white px-4 text-sm font-medium text-navy"
        >
          Comprovante
        </Link>
        <Link
          href={`/os/${os.id}/editar`}
          className="flex h-10 items-center rounded-lg border border-line bg-white px-4 text-sm font-medium text-navy"
        >
          Editar
        </Link>
      </div>

      {/* Cabeçalho: a etiqueta, em versão grande. */}
      <header className="overflow-hidden rounded-xl border border-line bg-white">
        <div
          className="px-4 py-2"
          style={{ backgroundColor: STATUS[status].cor }}
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-white">
            {STATUS[status].rotulo}
          </span>
        </div>
        <div className="p-4">
          <p className="dado text-3xl font-bold text-navy">
            {codigo(os.codigo_publico)}
          </p>
          <p className="dado text-sm text-mute">nº {os.numero}</p>
          <p className="mt-2 text-lg font-medium text-ink">
            {aparelho || "Sem aparelho"}
          </p>
        </div>
      </header>

      <section className={bloco}>
        <h2 className="mb-2 font-display font-semibold text-navy">Cliente</h2>
        <p className="font-medium">{cliente?.nome ?? "—"}</p>
        <p className="dado text-sm text-mute">{telefone(cliente?.telefone)}</p>
      </section>

      <section className={bloco}>
        <h2 className="mb-2 font-display font-semibold text-navy">Pedido</h2>
        <p className="whitespace-pre-wrap text-ink">{os.solicitacao}</p>
      </section>

      {os.diagnostico && (
        <section className={bloco}>
          <h2 className="mb-2 font-display font-semibold text-navy">
            Diagnóstico
          </h2>
          <p className="whitespace-pre-wrap text-ink">{os.diagnostico}</p>
        </section>
      )}

      {os.servico_realizado && (
        <section className={bloco}>
          <h2 className="mb-2 font-display font-semibold text-navy">
            Serviço realizado
          </h2>
          <p className="whitespace-pre-wrap text-ink">{os.servico_realizado}</p>
        </section>
      )}

      {os.motivo_cancelamento && (
        <section className={`${bloco} border-status-recusado/40`}>
          <h2 className="mb-2 font-display font-semibold text-status-recusado">
            Motivo do cancelamento
          </h2>
          <p className="whitespace-pre-wrap text-ink">
            {os.motivo_cancelamento}
          </p>
        </section>
      )}

      {(os.aparelho_identificador ||
        os.senha_tipo ||
        os.identificador_nao_identificado) && (
        <section className={bloco}>
          <h2 className="mb-2 font-display font-semibold text-navy">Aparelho</h2>
          {os.aparelho_identificador && (
            <p className="dado text-sm">
              <span className="text-mute">ID: </span>
              {os.aparelho_identificador}
            </p>
          )}
          {os.senha_tipo && (
            <p className="text-sm">
              <span className="text-mute">Desbloqueio: </span>
              <span className="font-medium">
                {ROTULO_SENHA[os.senha_tipo as TipoSenha]}
              </span>
              {os.senha_aparelho && (
                <span className="dado"> · {os.senha_aparelho}</span>
              )}
            </p>
          )}
          {os.identificador_nao_identificado && (
            <p className="text-sm text-amber">
              Identificação não verificável na entrada
            </p>
          )}
        </section>
      )}

      <section className={bloco}>
        <h2 className="mb-2 font-display font-semibold text-navy">Serviços</h2>
        <ul className="flex flex-col gap-2">
          {(servicos ?? []).map((s) => {
            const tipo = s.tipos_servico as unknown as { nome: string } | null;
            return (
              <li key={s.id} className="flex items-baseline gap-2">
                <span className="min-w-0 flex-1 truncate">{tipo?.nome}</span>
                <span className="dado text-sm text-mute">
                  {s.garantia_dias > 0 ? `${s.garantia_dias}d garantia` : "sem garantia"}
                </span>
                <span className="dado font-medium">{moeda(s.valor)}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={bloco}>
        <h2 className="mb-2 font-display font-semibold text-navy">Valores</h2>
        <dl className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-mute">Mão de obra</dt>
            <dd className="dado">{moeda(totais?.valor_mao_obra)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-mute">Peça</dt>
            <dd className="dado">{moeda(os.valor_peca)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-1 font-semibold">
            <dt>Total</dt>
            <dd className="dado">{moeda(totais?.valor_total)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-mute">Pago</dt>
            <dd className="dado">{moeda(totais?.valor_pago)}</dd>
          </div>
          {(totais?.saldo ?? 0) > 0 && (
            <div className="flex justify-between font-semibold text-amber">
              <dt>Saldo em aberto</dt>
              <dd className="dado">{moeda(totais?.saldo)}</dd>
            </div>
          )}
          <div className="mt-2 flex justify-between border-t border-line pt-2 text-mute">
            <dt>Lucro (interno)</dt>
            <dd className="dado">{moeda(totais?.lucro)}</dd>
          </div>
        </dl>
      </section>

      <section className={bloco}>
        <RegistrarPagamento
          ordemServicoId={os.id}
          saldo={Number(totais?.saldo ?? 0)}
        />
      </section>

      <section className={bloco}>
        <SeletorStatus
          id={os.id}
          atual={status}
          valorPago={Number(totais?.valor_pago ?? 0)}
        />
      </section>

      <p className="dado px-1 pb-6 text-xs text-mute">
        Entrada {dataHora(os.data_entrada)}
        {os.data_conclusao && ` · Pronto ${dataHora(os.data_conclusao)}`}
        {os.data_entrega && ` · Entregue ${dataHora(os.data_entrega)}`}
      </p>
    </div>
  );
}
