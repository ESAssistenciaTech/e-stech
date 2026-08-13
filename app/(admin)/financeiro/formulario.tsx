"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  CATEGORIAS_ENTRADA,
  CATEGORIAS_SAIDA,
  FORMAS_PAGAMENTO,
  ROTULO_CATEGORIA,
  ROTULO_FORMA,
} from "@/lib/caixa";
import { registrarMovimentacao } from "./actions";
import { CAIXA_INICIAL } from "@/lib/caixa";

const campo =
  "h-12 w-full rounded-lg border border-line bg-white px-3 text-base text-ink outline-none focus:border-cyan-deep";

export function FormularioMovimentacao() {
  const [estado, acao, enviando] = useActionState(
    registrarMovimentacao,
    CAIXA_INICIAL,
  );
  const [tipo, setTipo] = useState<"entrada" | "saida">("entrada");
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.ok) form.current?.reset();
  }, [estado.ok]);

  const categorias = tipo === "entrada" ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA;

  return (
    <form
      ref={form}
      action={acao}
      className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4"
    >
      <h2 className="font-display text-lg font-semibold text-navy">
        Registrar movimentação
      </h2>

      <div className="flex gap-2">
        {(["entrada", "saida"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTipo(t)}
            className={`h-12 flex-1 rounded-lg border font-display font-semibold ${
              tipo === t
                ? t === "entrada"
                  ? "border-status-pronto bg-status-pronto text-white"
                  : "border-status-recusado bg-status-recusado text-white"
                : "border-line text-mute"
            }`}
          >
            {t === "entrada" ? "Entrou" : "Saiu"}
          </button>
        ))}
      </div>
      <input type="hidden" name="tipo" value={tipo} />

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">Valor</span>
        <input name="valor" inputMode="decimal" required className={`dado ${campo}`} />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">Categoria</span>
        {/* key força o select a remontar quando o tipo muda, senão fica
            marcada uma categoria que não existe mais. */}
        <select key={tipo} name="categoria" className={campo}>
          {categorias.map((c) => (
            <option key={c} value={c}>
              {ROTULO_CATEGORIA[c]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">Forma</span>
        <select name="forma_pagamento" className={campo}>
          {FORMAS_PAGAMENTO.map((f) => (
            <option key={f} value={f}>
              {ROTULO_FORMA[f]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">Descrição</span>
        <input name="descricao" placeholder="Opcional" className={campo} />
      </label>

      {estado.erro && (
        <p role="alert" className="text-sm font-medium text-status-recusado">
          {estado.erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="h-12 rounded-lg bg-cyan-deep font-display font-semibold text-white hover:bg-navy disabled:opacity-60"
      >
        {enviando ? "Registrando…" : "Registrar"}
      </button>
    </form>
  );
}
