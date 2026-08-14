"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registrarCompra } from "../actions";
import { COMPRA_INICIAL, type Insumo } from "@/lib/insumo";
import { FORMAS_PAGAMENTO, ROTULO_FORMA } from "@/lib/caixa";

const campo =
  "h-12 w-full rounded-lg border border-line bg-white px-3 text-base text-ink outline-none focus:border-cyan-deep";

export function FormularioCompra({ insumos }: { insumos: Insumo[] }) {
  const [estado, acao, enviando] = useActionState(
    registrarCompra,
    COMPRA_INICIAL,
  );

  return (
    <form action={acao} className="flex flex-col gap-4">
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-mute">
          Quanto entrou
        </h2>
        <ul className="rounded-xl border border-line bg-white">
          {insumos.map((i, indice) => (
            <li
              key={i.id}
              className={`flex items-center gap-3 px-4 py-2 ${
                indice > 0 ? "border-t border-line" : ""
              }`}
            >
              <label className="flex min-w-0 flex-1 flex-col" htmlFor={i.id}>
                <span className="truncate font-medium text-ink">{i.nome}</span>
                <span className="dado text-xs text-mute">
                  {i.quantidade === 0 ? "acabou" : `tem ${i.quantidade}`}
                </span>
              </label>
              <input
                id={i.id}
                name={`qtd_${i.id}`}
                inputMode="numeric"
                placeholder="0"
                aria-label={`Quantidade comprada de ${i.nome}`}
                className={`dado h-12 w-20 shrink-0 rounded-lg border border-line bg-white px-3 text-center text-base outline-none focus:border-cyan-deep`}
              />
            </li>
          ))}
        </ul>
        <p className="mt-2 px-1 text-xs text-mute">
          Deixe em branco o que você não comprou. Ele continua na lista.
        </p>
      </section>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">Quanto foi pago</span>
        <input
          name="valor"
          inputMode="decimal"
          required
          placeholder="0,00"
          className={`dado ${campo}`}
        />
        <span className="text-xs text-mute">
          O total da compra. Vira uma saída no caixa no mesmo ato.
        </span>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">Forma</span>
        <select name="forma_pagamento" className={campo} defaultValue="dinheiro">
          {FORMAS_PAGAMENTO.map((f) => (
            <option key={f} value={f}>
              {ROTULO_FORMA[f]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">
          Descrição no caixa
        </span>
        <input
          name="observacao"
          placeholder="deixe vazio para listar os itens"
          className={campo}
        />
      </label>

      {estado.erro && (
        <p role="alert" className="text-sm font-medium text-status-recusado">
          {estado.erro}
        </p>
      )}

      <div className="flex gap-2">
        <Link
          href="/insumos"
          className="flex h-12 flex-1 items-center justify-center rounded-lg border border-line font-medium text-mute"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={enviando}
          className="h-12 flex-[2] rounded-lg bg-cyan-deep font-display font-semibold text-white hover:bg-navy disabled:opacity-60"
        >
          {enviando ? "Registrando…" : "Registrar compra"}
        </button>
      </div>
    </form>
  );
}
