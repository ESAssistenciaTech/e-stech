"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { moeda, telefone } from "@/lib/formato";
import {
  OS_EDICAO_INICIAL,
  ROTULO_IDENTIFICADOR,
  TIPOS_APARELHO,
  type Cliente,
  type OrdemServico,
  type TipoAparelho,
  type TipoServico,
} from "@/lib/tipos";
import { atualizarOS } from "./actions";

const campo =
  "h-12 w-full rounded-lg border border-line bg-white px-3 text-base text-ink outline-none focus:border-cyan-deep";
const area =
  "w-full rounded-lg border border-line bg-white p-3 text-base text-ink outline-none focus:border-cyan-deep";
const bloco = "rounded-xl border border-line bg-white p-4";
const titulo = "mb-3 font-display text-lg font-semibold text-navy";

type Linha = {
  id?: string;
  tipo_servico_id: string;
  nome: string;
  valor: number;
  garantia_dias: number;
};

export function FormularioEditarOS({
  os,
  cliente,
  servicos: iniciais,
  tipos,
}: {
  os: OrdemServico;
  cliente: Cliente;
  servicos: Linha[];
  tipos: TipoServico[];
}) {
  const [estado, acao, enviando] = useActionState(
    atualizarOS,
    OS_EDICAO_INICIAL,
  );

  const [clienteAtual, setClienteAtual] = useState<Cliente>(cliente);
  const [trocando, setTrocando] = useState(false);
  const [busca, setBusca] = useState("");
  const [achados, setAchados] = useState<Cliente[]>([]);

  const [tipoAparelho, setTipoAparelho] = useState<TipoAparelho | "">(
    os.aparelho_tipo ?? "",
  );
  const [servicos, setServicos] = useState<Linha[]>(iniciais);

  useEffect(() => {
    if (!trocando || busca.trim().length < 2) {
      setAchados([]);
      return;
    }
    const t = setTimeout(async () => {
      const supabase = createClient();
      const termo = `%${busca.trim()}%`;
      const { data } = await supabase
        .from("clientes")
        .select("*")
        .or(`nome.ilike.${termo},telefone.ilike.${termo},cpf.ilike.${termo}`)
        .limit(6);
      setAchados(data ?? []);
    }, 250);
    return () => clearTimeout(t);
  }, [busca, trocando]);

  const maoDeObra = useMemo(
    () => servicos.reduce((s, x) => s + x.valor, 0),
    [servicos],
  );

  return (
    <form action={acao} className="flex flex-col gap-4 pb-28">
      <input type="hidden" name="id" value={os.id} />
      <input type="hidden" name="cliente_id" value={clienteAtual.id} />

      {/* Cliente ------------------------------------------------------- */}
      <section className={bloco}>
        <h2 className={titulo}>Cliente</h2>
        {!trocando ? (
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink">
                {clienteAtual.nome}
              </p>
              <p className="dado truncate text-sm text-mute">
                {telefone(clienteAtual.telefone)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTrocando(true)}
              className="shrink-0 rounded px-3 py-2 text-sm font-medium text-cyan-deep"
            >
              Trocar
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Nome, telefone ou CPF"
              autoFocus
              className={campo}
            />
            <ul className="flex flex-col gap-1">
              {achados.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setClienteAtual(c);
                      setTrocando(false);
                      setBusca("");
                    }}
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
            <button
              type="button"
              onClick={() => {
                setTrocando(false);
                setBusca("");
              }}
              className="h-11 rounded-lg border border-line text-sm font-medium text-mute"
            >
              Manter {clienteAtual.nome}
            </button>
          </div>
        )}
      </section>

      {/* Trabalho ------------------------------------------------------ */}
      <section className={bloco}>
        <h2 className={titulo}>Trabalho</h2>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-mute">
              O que o cliente pediu
            </span>
            <textarea
              name="solicitacao"
              required
              rows={2}
              defaultValue={os.solicitacao}
              className={area}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-mute">Diagnóstico</span>
            <textarea
              name="diagnostico"
              rows={3}
              defaultValue={os.diagnostico ?? ""}
              placeholder="O que você encontrou ao abrir"
              className={area}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-mute">
              Serviço realizado
            </span>
            <textarea
              name="servico_realizado"
              rows={3}
              defaultValue={os.servico_realizado ?? ""}
              placeholder="O que foi feito de fato"
              className={area}
            />
          </label>
        </div>
      </section>

      {/* Aparelho ------------------------------------------------------ */}
      <section className={bloco}>
        <h2 className={titulo}>Aparelho</h2>
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
              <input
                name="aparelho_marca"
                defaultValue={os.aparelho_marca ?? ""}
                placeholder="Marca"
                className={campo}
              />
              <input
                name="aparelho_modelo"
                defaultValue={os.aparelho_modelo ?? ""}
                placeholder="Modelo"
                className={campo}
              />
              <input
                name="aparelho_identificador"
                defaultValue={os.aparelho_identificador ?? ""}
                placeholder={ROTULO_IDENTIFICADOR[tipoAparelho]}
                className={campo}
              />
              <input
                name="senha_aparelho"
                defaultValue={os.senha_aparelho ?? ""}
                placeholder="Senha do aparelho"
                className={campo}
              />
            </>
          )}
        </div>
      </section>

      {/* Serviços ------------------------------------------------------ */}
      <section className={bloco}>
        <h2 className={titulo}>Serviços</h2>

        <ul className="mb-3 flex flex-col gap-2">
          {servicos.map((s, i) => (
            <li key={s.id ?? `novo-${i}`} className="rounded-lg border border-line p-3">
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

        <div className="flex flex-wrap gap-2">
          {tipos.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() =>
                setServicos((a) => [
                  ...a,
                  {
                    tipo_servico_id: t.id,
                    nome: t.nome,
                    valor: Number(t.valor_padrao),
                    garantia_dias: t.garantia_dias_padrao,
                  },
                ])
              }
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
            servicos.map(({ id, tipo_servico_id, valor, garantia_dias }) => ({
              id,
              tipo_servico_id,
              valor,
              garantia_dias,
            })),
          )}
        />
      </section>

      {/* Peça ---------------------------------------------------------- */}
      <section className={bloco}>
        <h2 className={titulo}>Peça</h2>
        <div className="flex gap-2">
          <label className="flex-1">
            <span className="text-sm font-medium text-mute">Valor cobrado</span>
            <input
              name="valor_peca"
              inputMode="decimal"
              defaultValue={os.valor_peca}
              className={`dado ${campo}`}
            />
          </label>
          <label className="flex-1">
            <span className="text-sm font-medium text-mute">Custo</span>
            <input
              name="custo_peca"
              inputMode="decimal"
              defaultValue={os.custo_peca}
              className={`dado ${campo}`}
            />
          </label>
        </div>
      </section>

      {estado.erro && (
        <p role="alert" className="text-sm font-medium text-status-recusado">
          {estado.erro}
        </p>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-paper/95 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-mute">Mão de obra</p>
            <p className="dado text-lg font-semibold text-navy">
              {moeda(maoDeObra)}
            </p>
          </div>
          <Link
            href={`/os/${os.id}`}
            className="flex h-12 shrink-0 items-center rounded-lg border border-line px-4 font-medium text-mute"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={enviando}
            className="h-12 shrink-0 rounded-lg bg-cyan-deep px-6 font-display font-semibold text-white hover:bg-navy disabled:opacity-60"
          >
            {enviando ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </form>
  );
}
