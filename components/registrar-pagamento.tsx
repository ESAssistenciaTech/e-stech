"use client";

import { useActionState, useEffect, useState } from "react";
import {
  FORMAS_PAGAMENTO,
  ROTULO_FORMA,
} from "@/lib/caixa";
import { moeda } from "@/lib/formato";
import {
  registrarMovimentacao,
  CAIXA_INICIAL,
} from "@/app/(admin)/financeiro/actions";

/**
 * Recebimento a partir da OS — o caminho do balcão. Vem preenchido com o
 * saldo, porque o normal é o cliente quitar o que falta; mas o valor é
 * editável, já que sinal e pagamento parcial são rotina (ADR 0002).
 */
export function RegistrarPagamento({
  ordemServicoId,
  saldo,
}: {
  ordemServicoId: string;
  saldo: number;
}) {
  const [estado, acao, enviando] = useActionState(
    registrarMovimentacao,
    CAIXA_INICIAL,
  );
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (estado.ok) setAberto(false);
  }, [estado.ok]);

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="h-12 w-full rounded-lg bg-cyan-deep font-display font-semibold text-white hover:bg-navy"
      >
        {saldo > 0 ? `Receber ${moeda(saldo)}` : "Registrar pagamento"}
      </button>
    );
  }

  return (
    <form action={acao} className="flex flex-col gap-3">
      <input type="hidden" name="tipo" value="entrada" />
      <input type="hidden" name="categoria" value="servico" />
      <input type="hidden" name="ordem_servico_id" value={ordemServicoId} />

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">Valor recebido</span>
        <input
          name="valor"
          inputMode="decimal"
          autoFocus
          defaultValue={saldo > 0 ? String(saldo) : ""}
          className="dado h-12 w-full rounded-lg border border-line bg-white px-3 text-base outline-none focus:border-cyan-deep"
        />
      </label>

      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-sm font-medium text-mute">Forma</legend>
        <div className="flex flex-wrap gap-2">
          {FORMAS_PAGAMENTO.map((f, i) => (
            <label
              key={f}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-line px-3 has-[:checked]:border-cyan-deep has-[:checked]:bg-cyan/10"
            >
              <input
                type="radio"
                name="forma_pagamento"
                value={f}
                defaultChecked={i === 0}
                className="accent-cyan-deep"
              />
              <span className="text-sm">{ROTULO_FORMA[f]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {estado.erro && (
        <p role="alert" className="text-sm font-medium text-status-recusado">
          {estado.erro}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="h-12 flex-1 rounded-lg border border-line font-medium text-mute"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={enviando}
          className="h-12 flex-[2] rounded-lg bg-cyan-deep font-display font-semibold text-white hover:bg-navy disabled:opacity-60"
        >
          {enviando ? "Registrando…" : "Registrar"}
        </button>
      </div>
    </form>
  );
}
