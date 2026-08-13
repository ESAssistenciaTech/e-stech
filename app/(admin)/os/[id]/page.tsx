import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { AvisarWhatsApp } from "@/components/avisar-whatsapp";
import { situacaoSugerida, type ModeloMensagem } from "@/lib/mensagem";
import { codigo, dataHora, diasDesde, moeda, telefone } from "@/lib/formato";
import {
  ROTULO_SENHA,
  STATUS,
  type StatusOS,
  type TipoSenha,
} from "@/lib/tipos";
import { SeletorStatus } from "./seletor-status";
import { RegistrarPagamento } from "@/components/registrar-pagamento";

const bloco = "rounded-xl border border-line bg-white p-4";
const rotuloBloco =
  "mb-2 text-xs font-semibold uppercase tracking-wide text-mute";

export default async function DetalheOSPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: os },
    { data: totais },
    { data: servicos },
    { data: modelos },
    { data: loja },
  ] = await Promise.all([
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
    supabase.from("modelos_mensagem").select("id, situacao, texto"),
    supabase
      .from("dados_loja")
      .select("nome")
      .eq("singleton", true)
      .maybeSingle(),
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

  const parada = diasDesde(os.atualizado_em);
  const saldo = Number(totais?.saldo ?? 0);

  // O link que vai na mensagem tem que ser o endereço público de verdade —
  // em produção é o domínio da Vercel, não localhost.
  const cabecalhos = await headers();
  const host = cabecalhos.get("host") ?? "localhost:3000";
  const enderecoBase = `${host.startsWith("localhost") ? "http" : "https"}://${host}`;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="nao-imprimir flex items-center gap-2">
        <Link href="/os" className="text-sm font-medium text-cyan-deep">
          ← Ordens
        </Link>
        <Link
          href={`/os/${os.id}/comprovante`}
          className="ml-auto flex h-10 items-center rounded-lg border border-line bg-white px-3 text-sm font-medium text-navy"
        >
          Comprovante
        </Link>
        <Link
          href={`/os/${os.id}/editar`}
          className="flex h-10 items-center rounded-lg border border-line bg-white px-3 text-sm font-medium text-navy"
        >
          Editar
        </Link>
      </div>

      {/* Hero: a etiqueta em tamanho de objeto. */}
      <header className="overflow-hidden rounded-xl border border-line bg-white">
        <div
          className="flex items-center gap-2 px-4 py-2"
          style={{ backgroundColor: STATUS[status].cor }}
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-white">
            {STATUS[status].rotulo}
          </span>
          {parada !== null && parada >= 10 && (
            <span className="dado ml-auto text-xs font-semibold text-white/90">
              parada há {parada} dias
            </span>
          )}
        </div>
        <div className="px-4 py-5">
          <p className="dado text-5xl font-bold leading-none tracking-tight text-navy">
            {codigo(os.codigo_publico)}
          </p>
          <p className="mt-3 text-lg font-medium text-ink">
            {aparelho || "Sem aparelho"}
          </p>
          <p className="dado text-sm text-mute">nº {os.numero}</p>
        </div>
      </header>

      {/* Ação antes dos fatos: quem abriu esta tela veio fazer alguma coisa,
          e rolar oito blocos pra chegar nela custa tempo de balcão. */}
      <section className={`${bloco} nao-imprimir flex flex-col gap-3`}>
        <AvisarWhatsApp
          modelos={(modelos ?? []) as ModeloMensagem[]}
          telefone={cliente?.telefone ?? null}
          sugestao={situacaoSugerida(status, saldo)}
          dados={{
            cliente: cliente?.nome ?? "",
            loja: loja?.nome ?? "E&S Tech",
            codigo: os.codigo_publico,
            aparelho: aparelho || null,
            valor: Number(totais?.valor_total ?? 0),
            saldo,
            link: `${enderecoBase}/acompanhar/${os.codigo_publico}`,
          }}
        />
        <RegistrarPagamento ordemServicoId={os.id} saldo={saldo} />
        <SeletorStatus
          id={os.id}
          atual={status}
          valorPago={Number(totais?.valor_pago ?? 0)}
        />
      </section>

      {/* Cliente e aparelho num compartimento só: são a mesma pergunta —
          de quem é isto e o que é. */}
      <section className={bloco}>
        <h2 className={rotuloBloco}>Quem e o quê</h2>
        <Link
          href={cliente ? `/clientes/${cliente.id}` : "/clientes"}
          className="flex min-h-11 items-center gap-2"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium text-ink">
              {cliente?.nome ?? "—"}
            </span>
            <span className="dado block text-sm text-mute">
              {telefone(cliente?.telefone)}
            </span>
          </span>
          <span className="shrink-0 text-sm text-cyan-deep">Ficha</span>
        </Link>

        {os.aparelho_tipo && (
          <dl className="mt-3 flex flex-col gap-1 border-t border-line pt-3 text-sm">
            {os.aparelho_identificador && (
              <div className="flex gap-2">
                <dt className="text-mute">Identificação</dt>
                <dd className="dado">{os.aparelho_identificador}</dd>
              </div>
            )}
            {os.identificador_nao_identificado && (
              <p className="text-amber">
                Identificação não verificável na entrada
              </p>
            )}
            {os.senha_tipo && (
              <div className="flex gap-2">
                <dt className="text-mute">Desbloqueio</dt>
                <dd>
                  <span className="font-medium">
                    {ROTULO_SENHA[os.senha_tipo as TipoSenha]}
                  </span>
                  {os.senha_aparelho && (
                    <span className="dado"> · {os.senha_aparelho}</span>
                  )}
                </dd>
              </div>
            )}
          </dl>
        )}
      </section>

      <section className={bloco}>
        <h2 className={rotuloBloco}>Relato do cliente</h2>
        <p className="whitespace-pre-wrap text-ink">{os.solicitacao}</p>

        {os.diagnostico && (
          <>
            <h2 className={`${rotuloBloco} mt-4`}>Diagnóstico</h2>
            <p className="whitespace-pre-wrap text-ink">{os.diagnostico}</p>
          </>
        )}

        {os.servico_realizado && (
          <>
            <h2 className={`${rotuloBloco} mt-4`}>Serviço realizado</h2>
            <p className="whitespace-pre-wrap text-ink">
              {os.servico_realizado}
            </p>
          </>
        )}
      </section>

      {os.motivo_cancelamento && (
        <section className={`${bloco} border-status-recusado/40`}>
          <h2 className={`${rotuloBloco} text-status-recusado`}>
            Motivo do cancelamento
          </h2>
          <p className="whitespace-pre-wrap text-ink">
            {os.motivo_cancelamento}
          </p>
        </section>
      )}

      <section className={bloco}>
        <h2 className={rotuloBloco}>Serviços e valores</h2>
        <ul className="flex flex-col gap-2">
          {(servicos ?? []).map((s) => {
            const tipo = s.tipos_servico as unknown as { nome: string } | null;
            return (
              <li key={s.id} className="flex items-baseline gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate">{tipo?.nome}</span>
                <span className="dado text-xs text-mute">
                  {s.garantia_dias > 0 ? `${s.garantia_dias}d` : "sem garantia"}
                </span>
                <span className="dado font-medium">{moeda(s.valor)}</span>
              </li>
            );
          })}
          {Number(os.valor_peca) > 0 && (
            <li className="flex items-baseline gap-2 text-sm">
              <span className="min-w-0 flex-1">Peça</span>
              <span className="dado font-medium">{moeda(os.valor_peca)}</span>
            </li>
          )}
        </ul>

        <dl className="mt-3 flex flex-col gap-1 border-t border-line pt-3">
          <div className="flex justify-between text-lg font-semibold">
            <dt>Total</dt>
            <dd className="dado">{moeda(totais?.valor_total)}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-mute">Pago</dt>
            <dd className="dado text-mute">{moeda(totais?.valor_pago)}</dd>
          </div>
          {saldo > 0 && (
            <div className="flex justify-between font-semibold text-amber">
              <dt>Saldo em aberto</dt>
              <dd className="dado">{moeda(saldo)}</dd>
            </div>
          )}
        </dl>

        {/* Recuado de propósito: é número seu, não do cliente, e não deve
            competir com o total quando a tela é mostrada no balcão. */}
        <dl className="mt-3 flex justify-between border-t border-line pt-2 text-xs text-mute">
          <dt>Custo da peça · lucro</dt>
          <dd className="dado">
            {moeda(os.custo_peca)} · {moeda(totais?.lucro)}
          </dd>
        </dl>
      </section>

      <p className="dado px-1 text-xs text-mute">
        Entrada {dataHora(os.data_entrada)}
        {os.data_conclusao && ` · Pronto ${dataHora(os.data_conclusao)}`}
        {os.data_entrega && ` · Entregue ${dataHora(os.data_entrega)}`}
      </p>
    </div>
  );
}
