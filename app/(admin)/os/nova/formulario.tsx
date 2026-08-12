"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { moeda, telefone } from "@/lib/formato";
import {
  ROTULO_IDENTIFICADOR,
  TIPOS_APARELHO,
  type Cliente,
  type TipoAparelho,
  type TipoServico,
} from "@/lib/tipos";
import { criarOS, type EstadoOS } from "./actions";

const INICIAL: EstadoOS = { erro: null };

const campo =
  "h-12 w-full rounded-lg border border-line bg-white px-3 text-base text-ink outline-none focus:border-cyan-deep";
const rotulo = "text-sm font-medium text-mute";
const bloco = "rounded-xl border border-line bg-white p-4";

type ServicoEscolhido = {
  tipo_servico_id: string;
  nome: string;
  valor: number;
  garantia_dias: number;
};

export function FormularioNovaOS({ tipos }: { tipos: TipoServico[] }) {
  const [estado, acao, enviando] = useActionState(criarOS, INICIAL);

  const [busca, setBusca] = useState("");
  const [achados, setAchados] = useState<Cliente[]>([]);
  const [cliente, setCliente] = useState<Cliente | null>(null);

  const [tipoAparelho, setTipoAparelho] = useState<TipoAparelho | "">("");
  const [servicos, setServicos] = useState<ServicoEscolhido[]>([]);

  // Busca casando nome, telefone e CPF — a defesa contra duplicata é esta,
  // não campo obrigatório (ADR 0004).
  useEffect(() => {
    if (cliente || busca.trim().length < 2) {
      setAchados([]);
      return;
    }
    const timer = setTimeout(async () => {
      const supabase = createClient();
      const termo = `%${busca.trim()}%`;
      const { data } = await supabase
        .from("clientes")
        .select("*")
        .or(`nome.ilike.${termo},telefone.ilike.${termo},cpf.ilike.${termo}`)
        .limit(6);
      setAchados(data ?? []);
    }, 250);
    return () => clearTimeout(timer);
  }, [busca, cliente]);

  const maoDeObra = useMemo(
    () => servicos.reduce((soma, s) => soma + s.valor, 0),
    [servicos],
  );

  function adicionarServico(tipo: TipoServico) {
    setServicos((atual) => [
      ...atual,
      {
        tipo_servico_id: tipo.id,
        nome: tipo.nome,
        // Copiados do cadastro e editáveis aqui: mudar o padrão do tipo
        // depois não altera OS já aberta.
        valor: Number(tipo.valor_padrao),
        garantia_dias: tipo.garantia_dias_padrao,
      },
    ]);
  }

  return (
    <form action={acao} className="flex flex-col gap-4 pb-28">
      {/* Cliente ------------------------------------------------------- */}
      <section className={bloco}>
        <h2 className="mb-3 font-display text-lg font-semibold text-navy">
          Cliente
        </h2>

        {cliente ? (
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink">{cliente.nome}</p>
              <p className="dado truncate text-sm text-mute">
                {telefone(cliente.telefone)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCliente(null);
                setBusca("");
              }}
              className="shrink-0 rounded px-3 py-2 text-sm font-medium text-cyan-deep"
            >
              Trocar
            </button>
            <input type="hidden" name="cliente_id" value={cliente.id} />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <label className={rotulo} htmlFor="busca">
              Buscar por nome, telefone ou CPF
            </label>
            <input
              id="busca"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Comece a digitar…"
              className={campo}
            />

            {achados.length > 0 && (
              <ul className="flex flex-col gap-1">
                {achados.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setCliente(c)}
                      className="flex min-h-12 w-full items-center rounded-lg border border-line px-3 text-left hover:border-cyan-deep"
                    >
                      <span className="min-w-0 flex-1 truncate">{c.nome}</span>
                      <span className="dado ml-2 shrink-0 text-sm text-mute">
                        {telefone(c.telefone)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {busca.trim().length >= 2 && (
              <div className="flex flex-col gap-3 border-t border-line pt-3">
                <p className="text-sm text-mute">
                  Não achou? Cadastre agora — só o nome é obrigatório.
                </p>
                <input
                  name="cliente_nome"
                  defaultValue={busca}
                  placeholder="Nome"
                  className={campo}
                />
                <input
                  name="cliente_telefone"
                  inputMode="tel"
                  placeholder="Telefone de contato"
                  className={campo}
                />
              </div>
            )}
          </div>
        )}
      </section>

      {/* Aparelho ------------------------------------------------------ */}
      <section className={bloco}>
        <h2 className="mb-1 font-display text-lg font-semibold text-navy">
          Aparelho
        </h2>
        <p className="mb-3 text-sm text-mute">
          Opcional — atendimento remoto ou em domicílio não tem aparelho na bancada.
        </p>

        <div className="flex flex-col gap-3">
          <select
            name="aparelho_tipo"
            value={tipoAparelho}
            onChange={(e) => setTipoAparelho(e.target.value as TipoAparelho | "")}
            className={campo}
          >
            <option value="">Sem aparelho</option>
            {TIPOS_APARELHO.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>

          {tipoAparelho && (
            <>
              <input name="aparelho_marca" placeholder="Marca" className={campo} />
              <input name="aparelho_modelo" placeholder="Modelo" className={campo} />
              <input
                name="aparelho_identificador"
                placeholder={ROTULO_IDENTIFICADOR[tipoAparelho]}
                className={campo}
              />
              <input
                name="senha_aparelho"
                placeholder="Senha do aparelho"
                className={campo}
              />
              <p className="text-xs text-mute">
                A senha fica só nesta área. Nunca aparece no portal nem no PDF.
              </p>
            </>
          )}
        </div>
      </section>

      {/* Solicitação --------------------------------------------------- */}
      <section className={bloco}>
        <h2 className="mb-3 font-display text-lg font-semibold text-navy">
          O que o cliente pediu
        </h2>
        <textarea
          name="solicitacao"
          required
          rows={3}
          placeholder="Nas palavras dele: tela quebrada, quer formatar, não liga…"
          className="w-full rounded-lg border border-line bg-white p-3 text-base text-ink outline-none focus:border-cyan-deep"
        />
      </section>

      {/* Serviços ------------------------------------------------------ */}
      <section className={bloco}>
        <h2 className="mb-3 font-display text-lg font-semibold text-navy">
          Serviços
        </h2>

        {servicos.length > 0 && (
          <ul className="mb-3 flex flex-col gap-2">
            {servicos.map((s, i) => (
              <li
                key={`${s.tipo_servico_id}-${i}`}
                className="rounded-lg border border-line p-3"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {s.nome}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setServicos((a) => a.filter((_, j) => j !== i))
                    }
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
                              ? {
                                  ...x,
                                  garantia_dias: Number(e.target.value) || 0,
                                }
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

        <div className="flex flex-wrap gap-2">
          {tipos.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => adicionarServico(t)}
              className="min-h-11 rounded-lg border border-line px-3 text-sm font-medium text-navy hover:border-cyan-deep"
            >
              + {t.nome}
            </button>
          ))}
        </div>

        <input
          type="hidden"
          name="servicos"
          value={JSON.stringify(
            servicos.map(({ tipo_servico_id, valor, garantia_dias }) => ({
              tipo_servico_id,
              valor,
              garantia_dias,
            })),
          )}
        />
      </section>

      {/* Peça ---------------------------------------------------------- */}
      <section className={bloco}>
        <h2 className="mb-3 font-display text-lg font-semibold text-navy">Peça</h2>
        <div className="flex gap-2">
          <label className="flex-1">
            <span className={rotulo}>Valor cobrado</span>
            <input
              name="valor_peca"
              inputMode="decimal"
              defaultValue={0}
              className={`dado ${campo}`}
            />
          </label>
          <label className="flex-1">
            <span className={rotulo}>Custo</span>
            <input
              name="custo_peca"
              inputMode="decimal"
              defaultValue={0}
              className={`dado ${campo}`}
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-mute">
          O custo é interno — é ele que transforma faturamento em lucro. O cliente
          nunca vê.
        </p>
      </section>

      {estado.erro && (
        <p role="alert" className="text-sm font-medium text-status-recusado">
          {estado.erro}
        </p>
      )}

      {/* Ação principal na metade de baixo: é onde o polegar chega. */}
      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-paper/95 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-mute">Mão de obra</p>
            <p className="dado text-lg font-semibold text-navy">
              {moeda(maoDeObra)}
            </p>
          </div>
          <button
            type="submit"
            disabled={enviando}
            className="h-12 shrink-0 rounded-lg bg-cyan-deep px-6 font-display text-base font-semibold text-white hover:bg-navy disabled:opacity-60"
          >
            {enviando ? "Abrindo…" : "Abrir OS"}
          </button>
        </div>
      </div>
    </form>
  );
}
