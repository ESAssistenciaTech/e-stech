"use client";

import { useState } from "react";
import {
  DICA_SENHA,
  ROTULO_SENHA,
  TIPOS_SENHA,
  type TipoSenha,
} from "@/lib/tipos";

/**
 * Registro de como o aparelho é desbloqueado.
 *
 * O padrão do Android é anotado como a sequência de pontos da grade 3x3 —
 * é assim que se anota no papel, e é o que dá para reproduzir com o
 * aparelho na mão. Digitar "1-2-3-6-9" de cabeça erra; tocar na ordem, não.
 */
export function CampoSenha({
  tipoInicial,
  valorInicial,
}: {
  tipoInicial?: TipoSenha | null;
  valorInicial?: string | null;
}) {
  const [tipo, setTipo] = useState<TipoSenha | "">(tipoInicial ?? "");
  const [valor, setValor] = useState(valorInicial ?? "");

  const pontos = valor
    .split("-")
    .map((p) => Number(p))
    .filter((n) => n >= 1 && n <= 9);

  function tocar(n: number) {
    if (pontos.includes(n)) return;
    setValor([...pontos, n].join("-"));
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-mute">Desbloqueio</span>

      <div className="flex flex-wrap gap-2">
        {TIPOS_SENHA.map((t) => (
          <label
            key={t}
            className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-3 has-[:checked]:border-cyan-deep has-[:checked]:bg-cyan/10"
          >
            <input
              type="radio"
              name="senha_tipo"
              value={t}
              checked={tipo === t}
              onChange={() => {
                setTipo(t);
                setValor("");
              }}
              className="accent-cyan-deep"
            />
            <span className="text-sm">{ROTULO_SENHA[t]}</span>
          </label>
        ))}
      </div>

      {tipo && tipo !== "sem_senha" && (
        <p className="text-xs text-mute">{DICA_SENHA[tipo]}</p>
      )}

      {tipo === "padrao" && (
        <div className="flex flex-col items-start gap-3">
          <div className="grid w-fit grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
              const ordem = pontos.indexOf(n);
              const marcado = ordem !== -1;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => tocar(n)}
                  aria-label={`Ponto ${n}${marcado ? `, posição ${ordem + 1}` : ""}`}
                  className={`dado flex size-14 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                    marcado
                      ? "border-cyan-deep bg-cyan-deep text-white"
                      : "border-line bg-white text-mute"
                  }`}
                >
                  {marcado ? ordem + 1 : ""}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            <span className="dado text-sm text-ink">
              {valor || "Nenhum ponto marcado"}
            </span>
            {valor && (
              <button
                type="button"
                onClick={() => setValor("")}
                className="text-sm font-medium text-status-recusado"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      )}

      {(tipo === "pin" || tipo === "senha") && (
        <input
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          inputMode={tipo === "pin" ? "numeric" : "text"}
          placeholder={tipo === "pin" ? "0000" : "Senha do aparelho"}
          className="dado h-12 w-full rounded-lg border border-line bg-white px-3 text-base outline-none focus:border-cyan-deep"
        />
      )}

      <input type="hidden" name="senha_aparelho" value={valor} />

      <p className="text-xs text-mute">
        Fica só nesta área. Nunca aparece no comprovante do cliente nem no
        portal.
      </p>
    </div>
  );
}
