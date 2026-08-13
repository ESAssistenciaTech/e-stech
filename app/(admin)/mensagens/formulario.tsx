"use client";

import { useActionState, useState } from "react";
import {
  QUANDO_USAR,
  ROTULO_SITUACAO,
  SITUACOES,
  VARIAVEIS,
  preencher,
  type ModeloMensagem,
} from "@/lib/mensagem";
import { LOJA_INICIAL } from "@/lib/tipos";
import { salvarMensagens } from "./actions";

/** Exemplo fixo, só pra mostrar como o texto fica preenchido. */
const EXEMPLO = {
  cliente: "Joaquim Ferreira",
  loja: "E&S Tech",
  codigo: "4K792X",
  aparelho: "Samsung Galaxy A14",
  valor: 380,
  saldo: 180,
  link: "https://estech.com.br/acompanhar/4K792X",
};

export function FormularioMensagens({
  modelos,
}: {
  modelos: ModeloMensagem[];
}) {
  const [estado, acao, enviando] = useActionState(
    salvarMensagens,
    LOJA_INICIAL,
  );

  const [textos, setTextos] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      SITUACOES.map((s) => [
        s,
        modelos.find((m) => m.situacao === s)?.texto ?? "",
      ]),
    ),
  );

  return (
    <form action={acao} className="flex flex-col gap-4">
      <section className="rounded-xl border border-line bg-white p-4">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-mute">
          Variáveis
        </h2>
        <p className="mb-3 text-sm text-mute">
          Escreva no texto e o sistema troca pelo dado da OS na hora de enviar.
        </p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {VARIAVEIS.map((v) => (
            <li key={v.chave}>
              <span className="dado font-semibold text-cyan-deep">
                {v.chave}
              </span>{" "}
              <span className="text-mute">{v.explica}</span>
            </li>
          ))}
        </ul>
      </section>

      {SITUACOES.map((s) => (
        <section key={s} className="rounded-xl border border-line bg-white p-4">
          <h2 className="font-display text-lg font-semibold text-navy">
            {ROTULO_SITUACAO[s]}
          </h2>
          <p className="mb-3 text-sm text-mute">{QUANDO_USAR[s]}</p>

          <textarea
            name={s}
            rows={4}
            value={textos[s]}
            onChange={(e) =>
              setTextos((t) => ({ ...t, [s]: e.target.value }))
            }
            className="w-full rounded-lg border border-line bg-white p-3 text-base text-ink outline-none focus:border-cyan-deep"
          />

          {/* Prévia com dado de exemplo: erro de variável aparece aqui, e não
              depois que a mensagem já está na frente do cliente. */}
          <div className="mt-2 rounded-lg bg-paper p-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-mute">
              Fica assim
            </p>
            <p className="whitespace-pre-wrap text-sm text-ink">
              {textos[s] ? preencher(textos[s], EXEMPLO) : "—"}
            </p>
          </div>
        </section>
      ))}

      {estado.erro && (
        <p role="alert" className="text-sm font-medium text-status-recusado">
          {estado.erro}
        </p>
      )}
      {estado.ok && (
        <p role="status" className="text-sm font-medium text-status-pronto">
          Mensagens salvas.
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="h-12 rounded-lg bg-cyan-deep font-display font-semibold text-white hover:bg-navy disabled:opacity-60"
      >
        {enviando ? "Salvando…" : "Salvar mensagens"}
      </button>
    </form>
  );
}
