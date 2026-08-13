import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { codigo, dataHora, moeda, telefone } from "@/lib/formato";
import { STATUS, type StatusOS } from "@/lib/tipos";
import { BotaoImprimir } from "./botao-imprimir";

/**
 * Comprovante de serviço para entregar ao cliente.
 *
 * NÃO é nota fiscal: não tem validade fiscal e não substitui NFe nem NFS-e.
 * É o documento que registra o que foi recebido, em que estado, o que foi
 * combinado e qual a garantia — vale como acordo entre as partes.
 *
 * Nunca imprimir aqui: senha do aparelho (o cliente já sabe a dele, e o
 * papel se perde) nem custo de peça (é a margem da loja).
 */
export default async function ComprovantePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: os }, { data: totais }, { data: servicos }, { data: loja }] =
    await Promise.all([
      supabase
        .from("ordens_servico")
        .select("*, clientes(nome, telefone, cpf)")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("ordens_servico_totais")
        .select("*")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("os_servicos")
        .select("id, valor, garantia_dias, tipos_servico(nome)")
        .eq("ordem_servico_id", id)
        .order("criado_em"),
      supabase.from("dados_loja").select("*").eq("singleton", true).maybeSingle(),
    ]);

  if (!os) notFound();

  const cliente = os.clientes as unknown as {
    nome: string;
    telefone: string | null;
    cpf: string | null;
  } | null;

  const partesAparelho = [
    os.marca_nao_identificada ? "marca não identificada" : os.aparelho_marca,
    os.modelo_nao_identificado ? "modelo não identificado" : os.aparelho_modelo,
  ].filter(Boolean);

  const maiorGarantia = Math.max(
    0,
    ...(servicos ?? []).map((s) => s.garantia_dias),
  );

  // Gerado aqui, não por serviço externo: mandar o código da OS para um
  // gerador de terceiro entregaria a ele o identificador do conserto.
  const cabecalhos = await headers();
  const host = cabecalhos.get("host") ?? "localhost:3000";
  const protocolo = host.startsWith("localhost") ? "http" : "https";
  const enderecoPortal = `${protocolo}://${host}/acompanhar/${os.codigo_publico}`;
  const qr = await QRCode.toString(enderecoPortal, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#12222e", light: "#00000000" },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="nao-imprimir mb-4 flex items-center gap-2">
        <Link href={`/os/${id}`} className="text-sm font-medium text-cyan-deep">
          ← Voltar
        </Link>
        <div className="ml-auto flex gap-2">
          <BotaoImprimir />
        </div>
      </div>

      <p className="nao-imprimir mb-4 rounded-lg border border-line bg-white p-3 text-xs text-mute">
        Comprovante de serviço, sem validade fiscal. Não substitui nota fiscal.
        Senha do aparelho e custo de peça não são impressos.
      </p>

      <article className="rounded-xl border border-line bg-white p-6 print:rounded-none print:border-0 print:p-0">
        {/* Cabeçalho ------------------------------------------------- */}
        <header className="bloco-impresso mb-5 flex items-start justify-between gap-4 border-b border-line pb-4">
          <div>
            <h1 className="font-display text-xl font-bold">
              {loja?.nome ?? "E&S Tech"}
            </h1>
            {loja?.endereco && (
              <p className="text-sm text-mute">{loja.endereco}</p>
            )}
            {loja?.telefone && (
              <p className="dado text-sm text-mute">
                {telefone(loja.telefone)}
              </p>
            )}
            {loja?.horario && (
              <p className="text-sm text-mute">{loja.horario}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-mute">
              Ordem de serviço
            </p>
            <p className="dado text-2xl font-bold">
              {codigo(os.codigo_publico)}
            </p>
            <p className="dado text-xs text-mute">nº {os.numero}</p>
          </div>
        </header>

        {/* Cliente e aparelho ---------------------------------------- */}
        <section className="bloco-impresso mb-5 grid gap-4 sm:grid-cols-2">
          <div>
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-mute">
              Cliente
            </h2>
            <p className="font-medium">{cliente?.nome ?? "—"}</p>
            {cliente?.telefone && (
              <p className="dado text-sm">{telefone(cliente.telefone)}</p>
            )}
            {cliente?.cpf && (
              <p className="dado text-sm text-mute">CPF {cliente.cpf}</p>
            )}
          </div>

          <div>
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-mute">
              Aparelho
            </h2>
            {os.aparelho_tipo ? (
              <>
                <p className="font-medium">
                  {partesAparelho.join(" ") || "Não identificado"}
                </p>
                <p className="text-sm text-mute">
                  {os.aparelho_tipo.charAt(0).toUpperCase() +
                    os.aparelho_tipo.slice(1)}
                </p>
                <p className="dado text-sm">
                  {os.identificador_nao_identificado ? (
                    <span className="text-mute">
                      Identificação não verificável — aparelho não liga ou tela
                      danificada
                    </span>
                  ) : (
                    os.aparelho_identificador ?? ""
                  )}
                </p>
              </>
            ) : (
              <p className="text-mute">Serviço sem aparelho</p>
            )}
          </div>
        </section>

        {/* Datas e status -------------------------------------------- */}
        <section className="bloco-impresso mb-5 flex flex-wrap gap-x-6 gap-y-1 border-y border-line py-3 text-sm">
          <p>
            <span className="text-mute">Entrada: </span>
            <span className="dado">{dataHora(os.data_entrada)}</span>
          </p>
          {os.data_entrega && (
            <p>
              <span className="text-mute">Entrega: </span>
              <span className="dado">{dataHora(os.data_entrega)}</span>
            </p>
          )}
          <p>
            <span className="text-mute">Situação: </span>
            <span className="font-medium">
              {STATUS[os.status as StatusOS].rotulo}
            </span>
          </p>
        </section>

        {/* Solicitação ----------------------------------------------- */}
        <section className="bloco-impresso mb-5">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-mute">
            Relato do cliente
          </h2>
          <p className="whitespace-pre-wrap">{os.solicitacao}</p>
        </section>

        {os.diagnostico && (
          <section className="bloco-impresso mb-5">
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-mute">
              Diagnóstico
            </h2>
            <p className="whitespace-pre-wrap">{os.diagnostico}</p>
          </section>
        )}

        {os.servico_realizado && (
          <section className="bloco-impresso mb-5">
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-mute">
              Serviço realizado
            </h2>
            <p className="whitespace-pre-wrap">{os.servico_realizado}</p>
          </section>
        )}

        {/* Serviços e valores ---------------------------------------- */}
        <section className="bloco-impresso mb-5">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-mute">
            Serviços
          </h2>
          <table className="w-full text-sm">
            <tbody>
              {(servicos ?? []).map((s) => {
                const tipo = s.tipos_servico as unknown as {
                  nome: string;
                } | null;
                return (
                  <tr key={s.id} className="border-b border-line">
                    <td className="py-2">{tipo?.nome}</td>
                    <td className="py-2 text-right text-mute">
                      {s.garantia_dias > 0
                        ? `${s.garantia_dias} dias de garantia`
                        : "sem garantia"}
                    </td>
                    <td className="dado py-2 text-right">{moeda(s.valor)}</td>
                  </tr>
                );
              })}
              {Number(os.valor_peca) > 0 && (
                <tr className="border-b border-line">
                  <td className="py-2">Peça</td>
                  <td />
                  <td className="dado py-2 text-right">
                    {moeda(os.valor_peca)}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td className="pt-3">Total</td>
                <td />
                <td className="dado pt-3 text-right">
                  {moeda(totais?.valor_total)}
                </td>
              </tr>
              {Number(totais?.valor_pago ?? 0) > 0 && (
                <>
                  <tr>
                    <td className="pt-1 text-mute">Pago</td>
                    <td />
                    <td className="dado pt-1 text-right text-mute">
                      {moeda(totais?.valor_pago)}
                    </td>
                  </tr>
                  <tr className="font-semibold">
                    <td className="pt-1">Saldo</td>
                    <td />
                    <td className="dado pt-1 text-right">
                      {moeda(totais?.saldo)}
                    </td>
                  </tr>
                </>
              )}
            </tfoot>
          </table>
        </section>

        {/* Garantia --------------------------------------------------- */}
        {maiorGarantia > 0 && (
          <section className="bloco-impresso mb-5 border-t border-line pt-4 text-sm">
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-mute">
              Garantia
            </h2>
            <p>
              A garantia é contada a partir da data de entrega e vale para cada
              serviço pelo prazo indicado acima. Cobre defeito no serviço
              executado e na peça aplicada. Não cobre nova queda, contato com
              líquido, violação por terceiros nem mau uso.
            </p>
          </section>
        )}

        {/* Acompanhamento e assinatura -------------------------------- */}
        <section className="bloco-impresso border-t border-line pt-4 text-sm">
          <div className="mb-6 flex items-center gap-4">
            <div
              className="size-24 shrink-0"
              aria-hidden
              dangerouslySetInnerHTML={{ __html: qr }}
            />
            <div>
              <p className="font-medium">Acompanhe pelo celular</p>
              <p className="text-mute">
                Aponte a câmera para o código ao lado, ou acesse{" "}
                <span className="dado">{host}/acompanhar</span> e digite{" "}
                <span className="dado font-semibold">
                  {codigo(os.codigo_publico)}
                </span>
                .
              </p>
            </div>
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <div className="border-t border-ink pt-1 text-xs text-mute">
                Cliente
              </div>
            </div>
            <div>
              <div className="border-t border-ink pt-1 text-xs text-mute">
                {loja?.nome ?? "E&S Tech"}
              </div>
            </div>
          </div>
        </section>
      </article>
    </div>
  );
}
