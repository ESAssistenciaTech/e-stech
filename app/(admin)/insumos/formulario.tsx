"use client";

import { useActionState } from "react";
import Link from "next/link";
import { salvarInsumo } from "./actions";
import { INSUMO_INICIAL, type Insumo } from "@/lib/insumo";

const campo =
  "h-12 w-full rounded-lg border border-line bg-white px-3 text-base text-ink outline-none focus:border-cyan-deep";

export function FormularioInsumo({ insumo }: { insumo?: Insumo }) {
  const [estado, acao, enviando] = useActionState(salvarInsumo, INSUMO_INICIAL);

  return (
    <form action={acao} className="flex flex-col gap-4">
      {insumo && <input type="hidden" name="id" value={insumo.id} />}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">Nome</span>
        <input
          name="nome"
          required
          autoFocus={!insumo}
          defaultValue={insumo?.nome ?? ""}
          placeholder="Película de vidro"
          className={campo}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">Quantidade</span>
        <input
          name="quantidade"
          inputMode="numeric"
          defaultValue={insumo?.quantidade ?? 0}
          className={`dado ${campo}`}
        />
        <span className="text-xs text-mute">
          Contada à mão, quando você olhar a gaveta. Nada desconta sozinho —
          nem OS, nem conserto.
        </span>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">Observações</span>
        <input
          name="observacoes"
          defaultValue={insumo?.observacoes ?? ""}
          placeholder="marca, onde comprar, referência"
          className={campo}
        />
      </label>

      <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-line bg-white px-3">
        <input
          type="checkbox"
          name="precisa_repor"
          defaultChecked={insumo?.precisa_repor ?? false}
          className="size-5 accent-cyan-deep"
        />
        <span className="text-sm">
          <span className="font-medium text-ink">Está na lista de compras</span>
          <span className="block text-xs text-mute">
            O mesmo que apertar &quot;Acabou&quot; na lista.
          </span>
        </span>
      </label>

      <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-line bg-white px-3">
        <input
          type="checkbox"
          name="ativo"
          defaultChecked={insumo ? insumo.ativo : true}
          className="size-5 accent-cyan-deep"
        />
        <span className="text-sm">
          <span className="font-medium text-ink">Ativo</span>
          <span className="block text-xs text-mute">
            Desativado some da lista de compras. Use para o que você parou de
            usar.
          </span>
        </span>
      </label>

      {estado.erro && (
        <p role="alert" className="text-sm font-medium text-status-recusado">
          {estado.erro}
        </p>
      )}

      <div className="flex gap-2">
        <Link
          href="/insumos?ver=todos"
          className="flex h-12 flex-1 items-center justify-center rounded-lg border border-line font-medium text-mute"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={enviando}
          className="h-12 flex-[2] rounded-lg bg-cyan-deep font-display font-semibold text-white hover:bg-navy disabled:opacity-60"
        >
          {enviando ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
