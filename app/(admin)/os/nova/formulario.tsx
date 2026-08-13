"use client";

import { useActionState } from "react";
import { BlocoCliente } from "@/components/bloco-cliente";
import { BlocoAparelho } from "@/components/bloco-aparelho";
import { SeletorServicos } from "@/components/seletor-servicos";
import { OS_INICIAL, type Marca, type TipoServico } from "@/lib/tipos";
import { criarOS } from "./actions";

const bloco = "rounded-xl border border-line bg-white p-4";
const titulo = "mb-3 font-display text-lg font-semibold text-navy";

export function FormularioNovaOS({
  tipos,
  marcas,
}: {
  tipos: TipoServico[];
  marcas: Marca[];
}) {
  const [estado, acao, enviando] = useActionState(criarOS, OS_INICIAL);

  return (
    <form action={acao} className="flex flex-col gap-4 pb-28">
      <section className={bloco}>
        <h2 className={titulo}>Cliente</h2>
        <BlocoCliente />
      </section>

      <section className={bloco}>
        <h2 className="mb-1 font-display text-lg font-semibold text-navy">
          Aparelho
        </h2>
        <p className="mb-3 text-sm text-mute">
          Opcional — atendimento remoto ou em domicílio não tem aparelho na
          bancada.
        </p>
        <BlocoAparelho marcas={marcas} />
      </section>

      <section className={bloco}>
        <h2 className={titulo}>O que o cliente pediu</h2>
        <textarea
          name="solicitacao"
          required
          rows={3}
          placeholder="Nas palavras dele: tela quebrada, quer formatar, não liga…"
          className="w-full rounded-lg border border-line bg-white p-3 text-base text-ink outline-none focus:border-cyan-deep"
        />
      </section>

      <section className={bloco}>
        <h2 className={titulo}>Serviços</h2>
        <SeletorServicos tipos={tipos} />
      </section>

      {/* Peça não entra aqui: na abertura você ainda não sabe qual peça vai
          usar nem quanto ela custa. Isso aparece depois do diagnóstico, na
          edição da OS. */}

      {estado.erro && (
        <p role="alert" className="text-sm font-medium text-status-recusado">
          {estado.erro}
        </p>
      )}

      {/* Ação principal na metade de baixo: é onde o polegar chega. */}
      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-paper/95 p-4 backdrop-blur">
        <div className="mx-auto max-w-2xl">
          <button
            type="submit"
            disabled={enviando}
            className="h-14 w-full rounded-lg bg-cyan-deep font-display text-base font-semibold text-white hover:bg-navy disabled:opacity-60"
          >
            {enviando ? "Abrindo…" : "Abrir OS"}
          </button>
        </div>
      </div>
    </form>
  );
}
