"use client";

import { useState } from "react";
import type { ServicoPublico } from "@/lib/portal";

/**
 * Serviços por categoria.
 *
 * Os botões trocam SÓ este bloco. WhatsApp, endereço e consulta de OS
 * continuam visíveis o tempo todo — quem vem do Instagram é impaciente, e
 * nada que gera contato pode ficar atrás de um clique.
 */
export function LandingServicos({
  categorias,
  whatsapp,
}: {
  categorias: [string, ServicoPublico[]][];
  /** Base do link; a mensagem é montada por categoria. */
  whatsapp: string | null;
}) {
  const [ativa, setAtiva] = useState(categorias[0]?.[0] ?? "");
  const servicos = categorias.find(([c]) => c === ativa)?.[1] ?? [];

  const link = whatsapp
    ? `${whatsapp}?text=${encodeURIComponent(
        `Oi! Vim pelo site. Quero consertar meu ${ativa}.`,
      )}`
    : null;

  return (
    <section className="w-full">
      <div className="mb-4 flex flex-wrap gap-2">
        {categorias.map(([categoria]) => (
          <button
            key={categoria}
            type="button"
            onClick={() => setAtiva(categoria)}
            className={`min-h-12 rounded-lg border px-4 font-display font-semibold transition-colors ${
              ativa === categoria
                ? "border-cyan bg-cyan text-navy"
                : "border-white/25 text-white/80"
            }`}
          >
            Meu {categoria}
          </button>
        ))}
      </div>

      <ul className="mb-5 flex flex-wrap gap-x-5 gap-y-1.5">
        {servicos.map((s) => (
          <li key={s.nome} className="flex items-center gap-2 text-white/85">
            <span aria-hidden className="size-1.5 rounded-full bg-cyan" />
            {s.nome}
          </li>
        ))}
      </ul>

      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-14 items-center justify-center gap-2 rounded-xl bg-status-pronto font-display text-lg font-semibold text-white"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-6" aria-hidden>
            <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm5.5 14.2c-.2.6-1.2 1.2-1.7 1.2-.4 0-1 .1-3.2-.8-2.7-1.1-4.4-3.9-4.5-4.1-.1-.2-1-1.4-1-2.7 0-1.3.6-1.9.9-2.2.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2 0 .4 0 .5l-.4.5c-.1.2-.3.3-.1.6.1.3.6 1.1 1.4 1.8 1 .9 1.8 1.1 2 1.2.3.1.4.1.6-.1l.8-1c.2-.2.4-.2.6-.1l1.9.9c.2.1.4.2.4.3.1.1.1.6-.1 1.1Z" />
          </svg>
          Falar no WhatsApp
        </a>
      )}
    </section>
  );
}
