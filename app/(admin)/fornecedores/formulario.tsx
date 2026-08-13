"use client";

import { useActionState } from "react";
import Link from "next/link";
import { LOJA_INICIAL } from "@/lib/tipos";
import type { Fornecedor } from "@/lib/cotacao";
import { salvarFornecedor } from "../cotacoes/actions";

const campo =
  "h-12 w-full rounded-lg border border-line bg-white px-3 text-base text-ink outline-none focus:border-cyan-deep";

export function FormularioFornecedor({
  fornecedor,
}: {
  fornecedor?: Fornecedor;
}) {
  const [estado, acao, enviando] = useActionState(
    salvarFornecedor,
    LOJA_INICIAL,
  );

  return (
    <form action={acao} className="flex flex-col gap-4">
      {fornecedor && <input type="hidden" name="id" value={fornecedor.id} />}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">Nome</span>
        <input
          name="nome"
          required
          autoFocus={!fornecedor}
          defaultValue={fornecedor?.nome ?? ""}
          className={campo}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">WhatsApp</span>
        <input
          name="telefone"
          inputMode="tel"
          defaultValue={fornecedor?.telefone ?? ""}
          className={`dado ${campo}`}
        />
        <span className="text-xs text-mute">
          É por aqui que a tela de cotação abre a conversa pra perguntar preço.
        </span>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">Observações</span>
        <textarea
          name="observacoes"
          rows={3}
          defaultValue={fornecedor?.observacoes ?? ""}
          placeholder="Prazo de entrega, o que costuma ter, como paga…"
          className="w-full rounded-lg border border-line bg-white p-3 text-base text-ink outline-none focus:border-cyan-deep"
        />
      </label>

      <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-line bg-white px-3">
        <input
          type="checkbox"
          name="ativo"
          defaultChecked={fornecedor ? fornecedor.ativo : true}
          className="size-5 accent-cyan-deep"
        />
        <span className="text-sm">
          <span className="font-medium text-ink">Ativo</span>
          <span className="block text-xs text-mute">
            Inativo some da tela de cotação, mas os preços antigos ficam no
            histórico.
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
          href="/fornecedores"
          className="flex h-12 flex-1 items-center justify-center rounded-lg border border-line font-medium text-mute"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={enviando}
          className="h-12 flex-2 rounded-lg bg-cyan-deep font-display font-semibold text-white hover:bg-navy disabled:opacity-60"
        >
          {enviando ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
