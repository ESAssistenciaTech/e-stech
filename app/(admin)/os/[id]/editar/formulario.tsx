"use client";

import { useActionState } from "react";
import Link from "next/link";
import { BlocoCliente } from "@/components/bloco-cliente";
import { BlocoAparelho } from "@/components/bloco-aparelho";
import {
  SeletorServicos,
  type LinhaServico,
} from "@/components/seletor-servicos";
import {
  OS_EDICAO_INICIAL,
  type Cliente,
  type Marca,
  type OrdemServico,
  type TipoServico,
} from "@/lib/tipos";
import { atualizarOS } from "./actions";

const campo =
  "h-12 w-full rounded-lg border border-line bg-white px-3 text-base text-ink outline-none focus:border-cyan-deep";
const area =
  "w-full rounded-lg border border-line bg-white p-3 text-base text-ink outline-none focus:border-cyan-deep";
const bloco = "rounded-xl border border-line bg-white p-4";
const titulo = "mb-3 font-display text-lg font-semibold text-navy";

export function FormularioEditarOS({
  os,
  cliente,
  servicos,
  tipos,
  marcas,
}: {
  os: OrdemServico;
  cliente: Cliente;
  servicos: LinhaServico[];
  tipos: TipoServico[];
  marcas: Marca[];
}) {
  const [estado, acao, enviando] = useActionState(
    atualizarOS,
    OS_EDICAO_INICIAL,
  );

  return (
    <form action={acao} className="flex flex-col gap-4 pb-28">
      <input type="hidden" name="id" value={os.id} />

      <section className={bloco}>
        <h2 className={titulo}>Cliente</h2>
        <BlocoCliente clienteInicial={cliente} />
      </section>

      <section className={bloco}>
        <h2 className={titulo}>Trabalho</h2>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-mute">
              O que o cliente pediu
            </span>
            <textarea
              name="solicitacao"
              required
              rows={2}
              defaultValue={os.solicitacao}
              className={area}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-mute">Diagnóstico</span>
            <textarea
              name="diagnostico"
              rows={3}
              defaultValue={os.diagnostico ?? ""}
              placeholder="O que você encontrou ao abrir"
              className={area}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-mute">
              Serviço realizado
            </span>
            <textarea
              name="servico_realizado"
              rows={3}
              defaultValue={os.servico_realizado ?? ""}
              placeholder="O que foi feito de fato"
              className={area}
            />
          </label>
        </div>
      </section>

      <section className={bloco}>
        <h2 className={titulo}>Aparelho</h2>
        <BlocoAparelho marcas={marcas} inicial={os} />
      </section>

      <section className={bloco}>
        <h2 className={titulo}>Serviços</h2>
        <SeletorServicos tipos={tipos} iniciais={servicos} />
      </section>

      <section className={bloco}>
        <h2 className="mb-1 font-display text-lg font-semibold text-navy">
          Peça
        </h2>
        <p className="mb-3 text-sm text-mute">
          Depois do diagnóstico, quando você já sabe qual peça vai usar.
        </p>
        <div className="flex gap-2">
          <label className="flex-1">
            <span className="text-sm font-medium text-mute">Valor cobrado</span>
            <input
              name="valor_peca"
              inputMode="decimal"
              defaultValue={os.valor_peca}
              className={`dado ${campo}`}
            />
          </label>
          <label className="flex-1">
            <span className="text-sm font-medium text-mute">Custo</span>
            <input
              name="custo_peca"
              inputMode="decimal"
              defaultValue={os.custo_peca}
              className={`dado ${campo}`}
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-mute">
          O custo é interno — é ele que transforma faturamento em lucro. O
          cliente nunca vê.
        </p>
      </section>

      {estado.erro && (
        <p role="alert" className="text-sm font-medium text-status-recusado">
          {estado.erro}
        </p>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-paper/95 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-2xl gap-2">
          <Link
            href={`/os/${os.id}`}
            className="flex h-14 flex-1 items-center justify-center rounded-lg border border-line font-medium text-mute"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={enviando}
            className="h-14 flex-2 rounded-lg bg-cyan-deep font-display text-base font-semibold text-white hover:bg-navy disabled:opacity-60"
          >
            {enviando ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </form>
  );
}
