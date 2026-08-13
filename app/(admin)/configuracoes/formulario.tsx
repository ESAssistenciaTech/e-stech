"use client";

import { useActionState } from "react";
import { salvarLoja } from "./actions";
import { LOJA_INICIAL, type DadosLoja } from "@/lib/tipos";

const campo =
  "h-12 w-full rounded-lg border border-line bg-white px-3 text-base text-ink outline-none focus:border-cyan-deep";

export function FormularioLoja({ loja }: { loja: DadosLoja }) {
  const [estado, acao, enviando] = useActionState(salvarLoja, LOJA_INICIAL);

  return (
    <form action={acao} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">Nome</span>
        <input
          name="nome"
          required
          defaultValue={loja.nome}
          className={campo}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">Endereço</span>
        <input
          name="endereco"
          defaultValue={loja.endereco ?? ""}
          placeholder="Rua, número, bairro, cidade"
          className={campo}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">Horário</span>
        <input
          name="horario"
          defaultValue={loja.horario ?? ""}
          placeholder="Seg a sex, 9h às 18h · Sáb, 9h às 13h"
          className={campo}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">Telefone da loja</span>
        <input
          name="telefone"
          inputMode="tel"
          defaultValue={loja.telefone ?? ""}
          className={`dado ${campo}`}
        />
        <span className="text-xs text-mute">
          É o número que vai no PDF e na landing — não o do cliente.
        </span>
      </label>

      {estado.erro && (
        <p role="alert" className="text-sm font-medium text-status-recusado">
          {estado.erro}
        </p>
      )}
      {estado.ok && (
        <p role="status" className="text-sm font-medium text-status-pronto">
          Dados salvos.
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="h-12 rounded-lg bg-cyan-deep font-display font-semibold text-white hover:bg-navy disabled:opacity-60"
      >
        {enviando ? "Salvando…" : "Salvar"}
      </button>
    </form>
  );
}
