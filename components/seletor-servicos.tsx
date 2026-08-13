"use client";

import { useMemo, useState } from "react";
import { moeda } from "@/lib/formato";
import type { TipoServico } from "@/lib/tipos";

export type LinhaServico = {
  /** Ausente quando a linha foi adicionada agora. */
  id?: string;
  tipo_servico_id: string;
  nome: string;
  valor: number;
  garantia_dias: number;
};

/**
 * Escolha de serviços com filtro.
 *
 * Botão por serviço funcionava com seis cadastrados; com trinta vira uma
 * parede. Digitar e filtrar escala, e o teclado do celular já abre no lugar
 * certo.
 */
export function SeletorServicos({
  tipos,
  iniciais = [],
}: {
  tipos: TipoServico[];
  iniciais?: LinhaServico[];
}) {
  const [servicos, setServicos] = useState<LinhaServico[]>(iniciais);
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return tipos;
    return tipos.filter(
      (t) =>
        t.nome.toLowerCase().includes(termo) ||
        t.categoria.toLowerCase().includes(termo),
    );
  }, [busca, tipos]);

  const maoDeObra = servicos.reduce((s, x) => s + x.valor, 0);

  function adicionar(t: TipoServico) {
    setServicos((a) => [
      ...a,
      {
        tipo_servico_id: t.id,
        nome: t.nome,
        valor: Number(t.valor_padrao),
        garantia_dias: t.garantia_dias_padrao,
      },
    ]);
    setBusca("");
    setAberto(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <input
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setAberto(true);
          }}
          onFocus={() => setAberto(true)}
          // Sem o atraso, o clique na opção é perdido pelo blur.
          onBlur={() => setTimeout(() => setAberto(false), 150)}
          placeholder="Buscar serviço…"
          className="h-12 w-full rounded-lg border border-line bg-white px-3 text-base outline-none focus:border-cyan-deep"
        />

        {aberto && (
          <ul className="absolute inset-x-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-line bg-white shadow-lg">
            {filtrados.length === 0 ? (
              <li className="px-3 py-3 text-sm text-mute">
                Nenhum serviço com esse nome.
              </li>
            ) : (
              filtrados.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => adicionar(t)}
                    className="flex min-h-12 w-full items-center gap-2 px-3 text-left hover:bg-cyan/10"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{t.nome}</span>
                      <span className="block text-xs text-mute">
                        {t.categoria}
                        {t.garantia_dias_padrao > 0
                          ? ` · ${t.garantia_dias_padrao}d`
                          : " · sem garantia"}
                      </span>
                    </span>
                    <span className="dado shrink-0 text-sm text-navy">
                      {moeda(t.valor_padrao)}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {servicos.length > 0 && (
        <ul className="flex flex-col gap-2">
          {servicos.map((s, i) => (
            <li
              key={s.id ?? `novo-${i}`}
              className="rounded-lg border border-line p-3"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate font-medium">
                  {s.nome}
                </span>
                <button
                  type="button"
                  onClick={() => setServicos((a) => a.filter((_, j) => j !== i))}
                  className="shrink-0 px-2 py-1 text-sm text-status-recusado"
                >
                  Remover
                </button>
              </div>
              <div className="flex gap-2">
                <label className="flex-1">
                  <span className="text-xs text-mute">Valor</span>
                  <input
                    inputMode="decimal"
                    value={s.valor}
                    onChange={(e) =>
                      setServicos((a) =>
                        a.map((x, j) =>
                          j === i
                            ? { ...x, valor: Number(e.target.value) || 0 }
                            : x,
                        ),
                      )
                    }
                    className="dado h-11 w-full rounded border border-line px-2"
                  />
                </label>
                <label className="flex-1">
                  <span className="text-xs text-mute">Garantia (dias)</span>
                  <input
                    inputMode="numeric"
                    value={s.garantia_dias}
                    onChange={(e) =>
                      setServicos((a) =>
                        a.map((x, j) =>
                          j === i
                            ? { ...x, garantia_dias: Number(e.target.value) || 0 }
                            : x,
                        ),
                      )
                    }
                    className="dado h-11 w-full rounded border border-line px-2"
                  />
                </label>
              </div>
            </li>
          ))}
        </ul>
      )}

      <input
        type="hidden"
        name="servicos"
        value={JSON.stringify(
          servicos.map(({ id, tipo_servico_id, valor, garantia_dias }) => ({
            id,
            tipo_servico_id,
            valor,
            garantia_dias,
          })),
        )}
      />
      <input type="hidden" name="mao_de_obra" value={maoDeObra} />
    </div>
  );
}
