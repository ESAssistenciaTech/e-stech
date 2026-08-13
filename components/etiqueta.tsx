import Link from "next/link";
import { STATUS, type StatusOS } from "@/lib/tipos";
import { codigo, data, diasDesde } from "@/lib/formato";

type Props = {
  id: string;
  codigoPublico: string;
  status: StatusOS;
  aparelho: string | null;
  cliente: string;
  dataEntrada: string;
  /** Último toque na OS. É daqui que sai a espessura da barra. */
  atualizadoEm?: string | null;
  saldo?: number;
};

/**
 * Espessura da barra pelo tempo parado.
 *
 * A cor já diz em que estado a OS está; a espessura diz há quantos dias
 * ninguém mexe nela. Duas informações na mesma marca, sem número pra ler
 * nem legenda pra decorar — barra grossa puxa o olho sozinha ao descer a
 * lista. O rótulo em texto continua ali para quem não distingue espessura.
 */
function espessura(dias: number | null) {
  if (dias === null || dias <= 1) return "w-1";
  if (dias <= 4) return "w-1.5";
  if (dias <= 9) return "w-2.5";
  return "w-4";
}

export function Etiqueta({
  id,

  codigoPublico,
  status,
  aparelho,
  cliente,
  dataEntrada,
  atualizadoEm,
  saldo,
}: Props) {
  const { rotulo, cor } = STATUS[status];
  const parado = diasDesde(atualizadoEm ?? dataEntrada);
  const encalhada = parado !== null && parado >= 10;

  return (
    <Link
      href={`/os/${id}`}
      className="group flex overflow-hidden rounded-lg border border-line bg-white transition-colors hover:border-cyan-deep"
    >
      <span
        aria-hidden
        className={`shrink-0 ${espessura(parado)}`}
        style={{ backgroundColor: cor }}
      />

      <div className="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-3">
        <div className="min-w-0 flex-1">
          {/* O código é o dado mais característico do sistema — é o que o
              olho procura na lista e o que o cliente dita no telefone. */}
          <p className="dado text-xl font-semibold leading-tight text-navy">
            {codigo(codigoPublico)}
          </p>
          <p className="mt-0.5 truncate text-sm text-ink">
            {aparelho ?? "Sem aparelho"}
          </p>
          <p className="truncate text-sm text-mute">{cliente}</p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1 text-right">
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-tight tracking-wide text-white"
            style={{ backgroundColor: cor }}
          >
            {rotulo}
          </span>
          <span className="dado text-xs text-mute">{data(dataEntrada)}</span>
          {encalhada && (
            <span className="dado text-xs font-semibold text-amber">
              {parado} dias parada
            </span>
          )}
          {saldo !== undefined && saldo > 0 && (
            <span className="text-xs font-medium text-amber">deve</span>
          )}
        </div>
      </div>
    </Link>
  );
}
