"use client";

import { useState } from "react";
import {
  ROTULO_SITUACAO,
  SITUACOES,
  linkWhatsApp,
  preencher,
  type DadosMensagem,
  type ModeloMensagem,
  type Situacao,
} from "@/lib/mensagem";

/**
 * Aviso ao cliente pelo WhatsApp.
 *
 * Mostra o texto final antes de abrir a conversa. Sem isso, um erro de
 * variável só aparece depois de a mensagem já estar na frente do cliente —
 * e no WhatsApp não dá pra desfazer.
 */
export function AvisarWhatsApp({
  modelos,
  dados,
  telefone,
  sugestao,
}: {
  modelos: ModeloMensagem[];
  dados: DadosMensagem;
  telefone: string | null;
  sugestao: Situacao;
}) {
  const [situacao, setSituacao] = useState<Situacao>(sugestao);
  const [aberto, setAberto] = useState(false);

  const modelo = modelos.find((m) => m.situacao === situacao);
  const texto = modelo ? preencher(modelo.texto, dados) : "";
  const link = linkWhatsApp(telefone, texto);

  if (!telefone) {
    return (
      <p className="text-sm text-mute">
        Sem telefone cadastrado, não dá pra avisar pelo WhatsApp. Adicione na
        ficha do cliente.
      </p>
    );
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-line bg-white font-display font-semibold text-navy hover:border-cyan-deep"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="size-5 text-status-pronto"
          aria-hidden
        >
          <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm5.5 14.2c-.2.6-1.2 1.2-1.7 1.2-.4 0-1 .1-3.2-.8-2.7-1.1-4.4-3.9-4.5-4.1-.1-.2-1-1.4-1-2.7 0-1.3.6-1.9.9-2.2.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2 0 .4 0 .5l-.4.5c-.1.2-.3.3-.1.6.1.3.6 1.1 1.4 1.8 1 .9 1.8 1.1 2 1.2.3.1.4.1.6-.1l.8-1c.2-.2.4-.2.6-.1l1.9.9c.2.1.4.2.4.3.1.1.1.6-.1 1.1Z" />
        </svg>
        Avisar no WhatsApp
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {SITUACOES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSituacao(s)}
            className={`min-h-10 rounded-lg border px-3 text-sm font-medium ${
              situacao === s
                ? "border-navy bg-navy text-white"
                : "border-line bg-white text-mute"
            }`}
          >
            {ROTULO_SITUACAO[s]}
          </button>
        ))}
      </div>

      {modelo ? (
        <p className="whitespace-pre-wrap rounded-lg border border-line bg-white p-3 text-sm text-ink">
          {texto}
        </p>
      ) : (
        <p className="rounded-lg border border-line bg-white p-3 text-sm text-mute">
          Sem modelo cadastrado para esta situação. Crie um em Ajustes.
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="h-12 flex-1 rounded-lg border border-line font-medium text-mute"
        >
          Fechar
        </button>
        {link && modelo && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 flex-2 items-center justify-center rounded-lg bg-status-pronto font-display font-semibold text-white"
          >
            Abrir conversa
          </a>
        )}
      </div>
    </div>
  );
}
