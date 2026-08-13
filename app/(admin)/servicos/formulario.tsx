"use client";

import { useActionState } from "react";
import Link from "next/link";
import { salvarServico } from "./actions";
import { SERVICO_INICIAL, type TipoServico } from "@/lib/tipos";

const campo =
  "h-12 w-full rounded-lg border border-line bg-white px-3 text-base text-ink outline-none focus:border-cyan-deep";

export function FormularioServico({
  servico,
  categorias,
}: {
  servico?: TipoServico;
  categorias: string[];
}) {
  const [estado, acao, enviando] = useActionState(
    salvarServico,
    SERVICO_INICIAL,
  );

  return (
    <form action={acao} className="flex flex-col gap-4">
      {servico && <input type="hidden" name="id" value={servico.id} />}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">Nome</span>
        <input
          name="nome"
          required
          autoFocus={!servico}
          defaultValue={servico?.nome ?? ""}
          placeholder="Troca de tela"
          className={campo}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">Categoria</span>
        {/* Lista as que já existem, mas aceita digitar uma nova: atender
            console ou impressora um dia não pode exigir deploy. */}
        <input
          name="categoria"
          required
          list="categorias"
          defaultValue={servico?.categoria ?? ""}
          placeholder="celular"
          className={campo}
        />
        <datalist id="categorias">
          {categorias.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <span className="text-xs text-mute">
          É por ela que a landing agrupa &quot;quero consertar meu ___&quot;.
        </span>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">Valor padrão</span>
        <input
          name="valor_padrao"
          inputMode="decimal"
          defaultValue={servico?.valor_padrao ?? 0}
          className={`dado ${campo}`}
        />
        <span className="text-xs text-mute">
          Vem preenchido na OS e continua editável lá. Mudar aqui não altera OS
          já abertas.
        </span>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">
          Garantia padrão (dias)
        </span>
        <input
          name="garantia_dias_padrao"
          inputMode="numeric"
          defaultValue={servico?.garantia_dias_padrao ?? 90}
          className={`dado ${campo}`}
        />
        <span className="text-xs text-mute">
          Zero para serviço sem garantia, como formatação.
        </span>
      </label>

      <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-line bg-white px-3">
        <input
          type="checkbox"
          name="ativo"
          defaultChecked={servico ? servico.ativo : true}
          className="size-5 accent-cyan-deep"
        />
        <span className="text-sm">
          <span className="font-medium text-ink">Ativo</span>
          <span className="block text-xs text-mute">
            Desativado some da abertura de OS, mas o histórico continua intacto.
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
          href="/servicos"
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
