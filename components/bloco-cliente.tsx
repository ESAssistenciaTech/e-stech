"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { soDigitos, telefone } from "@/lib/formato";
import type { Cliente } from "@/lib/tipos";

const campo =
  "h-12 w-full rounded-lg border border-line bg-white px-3 text-base text-ink outline-none focus:border-cyan-deep";

/**
 * Escolha do cliente na abertura da OS.
 *
 * Parte do cadastro, não da busca: cliente novo é o caso comum no balcão, e
 * obrigar a buscar primeiro cobra um passo de quem quase sempre não vai
 * encontrar nada. A busca acontece sozinha enquanto o nome e o CPF são
 * digitados — se já houver cadastro, o sistema avisa em vez de deixar
 * duplicar. É o ADR 0004 na prática: sem constraint, com busca boa.
 */
export function BlocoCliente({
  clienteInicial,
}: {
  clienteInicial?: Cliente | null;
}) {
  const [escolhido, setEscolhido] = useState<Cliente | null>(
    clienteInicial ?? null,
  );
  const [modoBusca, setModoBusca] = useState(false);

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [busca, setBusca] = useState("");

  const [parecidos, setParecidos] = useState<Cliente[]>([]);
  const [achados, setAchados] = useState<Cliente[]>([]);
  const [ignorou, setIgnorou] = useState(false);

  // Enquanto digita o cadastro, procura por parecido em silêncio.
  useEffect(() => {
    if (escolhido || modoBusca) return;
    const termoNome = nome.trim();
    const termoCpf = soDigitos(cpf);
    if (termoNome.length < 3 && termoCpf.length < 4) {
      setParecidos([]);
      return;
    }
    const t = setTimeout(async () => {
      const supabase = createClient();
      const filtros: string[] = [];
      if (termoNome.length >= 3) filtros.push(`nome.ilike.%${termoNome}%`);
      if (termoCpf.length >= 4) filtros.push(`cpf.ilike.%${termoCpf}%`);
      const { data } = await supabase
        .from("clientes")
        .select("*")
        .or(filtros.join(","))
        .limit(4);
      setParecidos(data ?? []);
    }, 350);
    return () => clearTimeout(t);
  }, [nome, cpf, escolhido, modoBusca]);

  useEffect(() => {
    if (!modoBusca || busca.trim().length < 2) {
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
        .limit(8);
      setAchados(data ?? []);
    }, 250);
    return () => clearTimeout(t);
  }, [busca, modoBusca]);

  // Já escolhido -----------------------------------------------------------
  if (escolhido) {
    return (
      <div className="flex items-center gap-3">
        <input type="hidden" name="cliente_id" value={escolhido.id} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink">{escolhido.nome}</p>
          <p className="dado truncate text-sm text-mute">
            {telefone(escolhido.telefone)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEscolhido(null);
            setModoBusca(false);
            setParecidos([]);
            setIgnorou(false);
          }}
          className="shrink-0 rounded px-3 py-2 text-sm font-medium text-cyan-deep"
        >
          Trocar
        </button>
      </div>
    );
  }

  // Busca de cadastrado ----------------------------------------------------
  if (modoBusca) {
    return (
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
                onClick={() => setEscolhido(c)}
                className="flex min-h-12 w-full items-center rounded-lg border border-line px-3 text-left hover:border-cyan-deep"
              >
                <span className="min-w-0 flex-1 truncate">{c.nome}</span>
                <span className="dado ml-2 shrink-0 text-sm text-mute">
                  {telefone(c.telefone)}
                </span>
              </button>
            </li>
          ))}
          {busca.trim().length >= 2 && achados.length === 0 && (
            <li className="px-1 py-2 text-sm text-mute">
              Ninguém com esse dado.
            </li>
          )}
        </ul>
        <button
          type="button"
          onClick={() => {
            setModoBusca(false);
            setBusca("");
          }}
          className="h-11 rounded-lg border border-line text-sm font-medium text-mute"
        >
          Cadastrar cliente novo
        </button>
      </div>
    );
  }

  // Cadastro (padrão) ------------------------------------------------------
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">Nome</span>
        <input
          name="cliente_nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          className={campo}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">
          Telefone de contato
        </span>
        <input
          name="cliente_telefone"
          inputMode="tel"
          className={`dado ${campo}`}
        />
        <span className="text-xs text-mute">
          O melhor número pra falar com ele — não o do aparelho que vai ficar
          aqui.
        </span>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">CPF</span>
        <input
          name="cliente_cpf"
          value={cpf}
          onChange={(e) => setCpf(e.target.value)}
          inputMode="numeric"
          className={`dado ${campo}`}
        />
      </label>

      {parecidos.length > 0 && !ignorou && (
        <div className="rounded-lg border border-amber/40 bg-amber/10 p-3">
          <p className="mb-2 text-sm font-medium text-ink">
            {parecidos.length === 1
              ? "Já existe um cliente parecido:"
              : "Já existem clientes parecidos:"}
          </p>
          <ul className="flex flex-col gap-1">
            {parecidos.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setEscolhido(c)}
                  className="flex min-h-11 w-full items-center rounded border border-line bg-white px-3 text-left"
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
            onClick={() => setIgnorou(true)}
            className="mt-2 text-sm font-medium text-mute underline"
          >
            Não é nenhum desses, cadastrar novo
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setModoBusca(true)}
        className="h-11 rounded-lg border border-line text-sm font-medium text-navy"
      >
        Cliente já cadastrado
      </button>
    </div>
  );
}
