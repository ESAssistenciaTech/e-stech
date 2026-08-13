"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { linkWhatsApp } from "@/lib/mensagem";
import { LOJA_INICIAL } from "@/lib/tipos";
import type { Fornecedor, Peca, Qualidade } from "@/lib/cotacao";
import { registrarCotacao } from "../actions";

const campo =
  "h-12 w-full rounded-lg border border-line bg-white px-3 text-base text-ink outline-none focus:border-cyan-deep";

/** chave "fornecedor|qualidade" → preço digitado */
type Grade = Record<string, string>;

export function FormularioCotacao({
  fornecedores,
  qualidades,
}: {
  fornecedores: Fornecedor[];
  qualidades: Qualidade[];
}) {
  const [estado, acao, enviando] = useActionState(
    registrarCotacao,
    LOJA_INICIAL,
  );

  const [busca, setBusca] = useState("");
  const [achadas, setAchadas] = useState<Peca[]>([]);
  const [peca, setPeca] = useState<Peca | null>(null);
  const [grade, setGrade] = useState<Grade>({});

  useEffect(() => {
    if (peca || busca.trim().length < 2) {
      setAchadas([]);
      return;
    }
    const t = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("pecas")
        .select("*")
        .ilike("nome", `%${busca.trim()}%`)
        .limit(6);
      setAchadas(data ?? []);
    }, 250);
    return () => clearTimeout(t);
  }, [busca, peca]);

  const precos = useMemo(
    () =>
      Object.entries(grade)
        .map(([chave, valor]) => {
          const [fornecedor_id, qualidade_id] = chave.split("|");
          const preco = Number(String(valor).replace(",", "."));
          return { fornecedor_id, qualidade_id, preco };
        })
        .filter((p) => Number.isFinite(p.preco) && p.preco > 0),
    [grade],
  );

  const pergunta = peca
    ? `Boa! Quanto está a ${peca.nome}?`
    : busca.trim()
      ? `Boa! Quanto está a ${busca.trim()}?`
      : "";

  return (
    <form action={acao} className="flex flex-col gap-4 pb-40">
      {/* Peça ----------------------------------------------------------- */}
      <section className="rounded-xl border border-line bg-white p-4">
        <h2 className="mb-3 font-display text-lg font-semibold text-navy">
          Qual peça
        </h2>

        {peca ? (
          <div className="flex items-center gap-3">
            <input type="hidden" name="peca_id" value={peca.id} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink">{peca.nome}</p>
              {peca.modelo_compativel && (
                <p className="truncate text-sm text-mute">
                  {peca.modelo_compativel}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setPeca(null);
                setBusca("");
              }}
              className="shrink-0 px-3 py-2 text-sm font-medium text-cyan-deep"
            >
              Trocar
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <input
              name="peca_nome"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Tela iPhone 12"
              autoFocus
              className={campo}
            />
            {achadas.length > 0 && (
              <ul className="flex flex-col gap-1">
                {achadas.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setPeca(p)}
                      className="flex min-h-12 w-full items-center rounded-lg border border-line px-3 text-left hover:border-cyan-deep"
                    >
                      <span className="min-w-0 flex-1 truncate">{p.nome}</span>
                      <span className="ml-2 shrink-0 text-xs text-mute">
                        já cotada
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {busca.trim().length >= 2 && (
              <input
                name="modelo_compativel"
                placeholder="Compatível com (opcional)"
                className={campo}
              />
            )}
          </div>
        )}
      </section>

      {/* Preços por fornecedor ------------------------------------------ */}
      {fornecedores.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white p-6 text-center text-sm text-mute">
          Cadastre um fornecedor antes de registrar preço.
        </p>
      ) : (
        fornecedores.map((f) => {
          const zap = pergunta ? linkWhatsApp(f.telefone, pergunta) : null;
          return (
            <section
              key={f.id}
              className="rounded-xl border border-line bg-white p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <h2 className="min-w-0 flex-1 truncate font-display text-lg font-semibold text-navy">
                  {f.nome}
                </h2>
                {/* Perguntar e anotar na mesma tela: é uma conversa só. */}
                {zap && (
                  <a
                    href={zap}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-lg border border-line px-3 py-2 text-sm font-medium text-status-pronto"
                  >
                    Perguntar
                  </a>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {qualidades.map((q) => {
                  const chave = `${f.id}|${q.id}`;
                  return (
                    <label key={q.id} className="flex items-center gap-3">
                      <span className="min-w-0 flex-1 truncate text-sm text-ink">
                        {q.nome}
                      </span>
                      <input
                        inputMode="decimal"
                        value={grade[chave] ?? ""}
                        onChange={(e) =>
                          setGrade((g) => ({ ...g, [chave]: e.target.value }))
                        }
                        placeholder="—"
                        className="dado h-11 w-28 rounded-lg border border-line px-3 text-right outline-none focus:border-cyan-deep"
                      />
                    </label>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-mute">
                Deixe em branco o que ele não tiver.
              </p>
            </section>
          );
        })
      )}

      <input type="hidden" name="precos" value={JSON.stringify(precos)} />

      {estado.erro && (
        <p role="alert" className="text-sm font-medium text-status-recusado">
          {estado.erro}
        </p>
      )}

      <div className="nao-imprimir fixed inset-x-0 bottom-16 z-10 border-t border-line bg-paper/95 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <p className="dado min-w-0 flex-1 text-sm text-mute">
            {precos.length === 0
              ? "nenhum preço"
              : precos.length === 1
                ? "1 preço"
                : `${precos.length} preços`}
          </p>
          <button
            type="submit"
            disabled={enviando || precos.length === 0}
            className="h-14 shrink-0 rounded-lg bg-cyan-deep px-6 font-display text-base font-semibold text-white hover:bg-navy disabled:opacity-40"
          >
            {enviando ? "Salvando…" : "Salvar cotação"}
          </button>
        </div>
      </div>
    </form>
  );
}
