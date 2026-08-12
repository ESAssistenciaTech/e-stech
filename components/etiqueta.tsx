import Link from "next/link";
import { STATUS, type StatusOS } from "@/lib/tipos";
import { codigo, data, diasDesde } from "@/lib/formato";

type Props = {
  id: string;
  numero: number;
  codigoPublico: string;
  status: StatusOS;
  aparelho: string | null;
  cliente: string;
  dataEntrada: string;
  dataConclusao: string | null;
  saldo?: number;
};

/**
 * A etiqueta de serviço — o elemento-assinatura do sistema (docs/design.md).
 *
 * É o artefato que a loja realmente produz: o que fica preso no aparelho na
 * entrada. Aparece na lista de OS, no portal público e no PDF, fazendo um
 * trabalho diferente em cada lugar. Aqui o trabalho é deixar a lista
 * escaneável de relance — daí a barra de status na lateral e o código em
 * mono, que é o que o olho procura.
 */
export function Etiqueta({
  id,
  numero,
  codigoPublico,
  status,
  aparelho,
  cliente,
  dataEntrada,
  dataConclusao,
  saldo,
}: Props) {
  const { rotulo, cor } = STATUS[status];
  const paradoHa = status === "pronto" ? diasDesde(dataConclusao) : null;

  return (
    <Link
      href={`/os/${id}`}
      className="group relative flex min-h-[88px] overflow-hidden rounded-lg border border-line bg-white transition-shadow hover:shadow-md"
    >
      {/* Barra de status: é ela que torna a lista escaneável de longe. */}
      <span
        aria-hidden
        className="w-1.5 shrink-0"
        style={{ backgroundColor: cor }}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1 px-4 py-3">
        <div className="flex items-baseline gap-2">
          <span className="dado text-lg font-semibold text-navy">
            {codigo(codigoPublico)}
          </span>
          <span className="dado text-xs text-mute">nº {numero}</span>
        </div>

        <p className="truncate font-medium text-ink">{aparelho ?? "Sem aparelho"}</p>
        <p className="truncate text-sm text-mute">{cliente}</p>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span
            className="rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white"
            style={{ backgroundColor: cor }}
          >
            {rotulo}
          </span>
          <span className="dado text-xs text-mute">{data(dataEntrada)}</span>
          {paradoHa !== null && paradoHa > 2 && (
            <span className="dado text-xs font-medium text-amber">
              parado há {paradoHa} dias
            </span>
          )}
          {saldo !== undefined && saldo > 0 && (
            <span className="dado text-xs font-medium text-amber">
              saldo em aberto
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
