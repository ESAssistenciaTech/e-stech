"use client";

import { useActionState } from "react";
import Link from "next/link";
import { salvarCliente } from "./actions";
import { CLIENTE_INICIAL } from "@/lib/tipos";
import type { Cliente } from "@/lib/tipos";

const campo =
  "h-12 w-full rounded-lg border border-line bg-white px-3 text-base text-ink outline-none focus:border-cyan-deep";

export function FormularioCliente({ cliente }: { cliente?: Cliente }) {
  const [estado, acao, enviando] = useActionState(
    salvarCliente,
    CLIENTE_INICIAL,
  );

  return (
    <form action={acao} className="flex flex-col gap-4">
      {cliente && <input type="hidden" name="id" value={cliente.id} />}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">Nome</span>
        <input
          name="nome"
          required
          autoFocus={!cliente}
          defaultValue={cliente?.nome ?? ""}
          className={campo}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">
          Telefone de contato
        </span>
        <input
          name="telefone"
          inputMode="tel"
          defaultValue={cliente?.telefone ?? ""}
          className={`dado ${campo}`}
        />
        <span className="text-xs text-mute">
          O melhor número pra falar com ele — não precisa ser o do aparelho que
          ficou na loja.
        </span>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">CPF</span>
        <input
          name="cpf"
          inputMode="numeric"
          defaultValue={cliente?.cpf ?? ""}
          className={`dado ${campo}`}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">Email</span>
        <input
          name="email"
          type="email"
          defaultValue={cliente?.email ?? ""}
          className={campo}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">Observações</span>
        <textarea
          name="observacoes"
          rows={3}
          defaultValue={cliente?.observacoes ?? ""}
          className="w-full rounded-lg border border-line bg-white p-3 text-base text-ink outline-none focus:border-cyan-deep"
        />
      </label>

      {estado.erro && (
        <p role="alert" className="text-sm font-medium text-status-recusado">
          {estado.erro}
        </p>
      )}

      <div className="flex gap-2">
        <Link
          href={cliente ? `/clientes/${cliente.id}` : "/clientes"}
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
