import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Insumo } from "@/lib/insumo";
import { alternarReposicao } from "./actions";

type Params = { searchParams: Promise<{ ver?: string }> };

/**
 * A tela principal do módulo é a lista de compras, não um relatório de saldo.
 *
 * A pergunta que se faz de um insumo não é "quantos eu tenho?" e sim "o que
 * eu preciso comprar?" — ver ADR 0006. Por isso o que abre por padrão é o que
 * está marcado, e o inventário inteiro é a visão secundária.
 */
export default async function InsumosPage({ searchParams }: Params) {
  const { ver } = await searchParams;
  const todos = ver === "todos";

  const supabase = await createClient();

  let consulta = supabase.from("insumos").select("*").order("nome");
  if (!todos) consulta = consulta.eq("precisa_repor", true).eq("ativo", true);

  const { data } = await consulta;
  const insumos = (data ?? []) as Insumo[];

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-4 flex items-center gap-3">
        <h1 className="font-display text-2xl font-bold text-navy">
          {todos ? "Insumos" : "Lista de compras"}
        </h1>
        <Link
          href="/insumos/novo"
          className="ml-auto flex h-11 items-center rounded-lg bg-cyan-deep px-4 font-display text-sm font-semibold text-white hover:bg-navy"
        >
          Novo
        </Link>
      </header>

      <div className="mb-4 flex gap-2">
        {[
          { rotulo: "Comprar", href: "/insumos", ativo: !todos },
          { rotulo: "Todos", href: "/insumos?ver=todos", ativo: todos },
        ].map((f) => (
          <Link
            key={f.href}
            href={f.href}
            aria-current={f.ativo ? "page" : undefined}
            className={`rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
              f.ativo
                ? "border-navy bg-navy text-white"
                : "border-line bg-white text-mute"
            }`}
          >
            {f.rotulo}
          </Link>
        ))}
      </div>

      {insumos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-white px-6 py-12 text-center">
          <p className="mb-1 font-display text-lg font-semibold text-navy">
            {todos ? "Nenhum insumo cadastrado" : "Nada para comprar"}
          </p>
          <p className="mb-5 text-sm text-mute">
            {todos
              ? "Película, cola, bateria genérica — o que a loja usa e acaba."
              : "Marque um insumo como acabado e ele aparece aqui."}
          </p>
          <Link
            href={todos ? "/insumos/novo" : "/insumos?ver=todos"}
            className="inline-flex h-12 items-center rounded-lg bg-cyan-deep px-5 font-display font-semibold text-white"
          >
            {todos ? "Cadastrar o primeiro" : "Ver todos os insumos"}
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {insumos.map((i) => (
            <li
              key={i.id}
              className={`flex items-stretch overflow-hidden rounded-lg border bg-white ${
                i.ativo ? "border-line" : "border-dashed border-line"
              }`}
            >
              <Link
                href={`/insumos/${i.id}`}
                className="flex min-w-0 flex-1 flex-col justify-center px-4 py-3"
              >
                <p
                  className={`truncate font-medium ${
                    i.ativo ? "text-ink" : "text-mute line-through"
                  }`}
                >
                  {i.nome}
                </p>
                <p className="dado truncate text-xs text-mute">
                  {i.quantidade === 0 ? "acabou" : `tem ${i.quantidade}`}
                  {i.observacoes && ` · ${i.observacoes}`}
                </p>
              </Link>

              {/* Um toque, direto da lista: é o gesto que se faz de pé na
                  bancada com o frasco vazio na mão. */}
              <form action={alternarReposicao} className="flex">
                <input type="hidden" name="id" value={i.id} />
                <input
                  type="hidden"
                  name="marcar"
                  value={i.precisa_repor ? "false" : "true"}
                />
                <button
                  type="submit"
                  className={`min-w-24 border-l border-line px-4 text-sm font-medium ${
                    i.precisa_repor ? "text-mute" : "text-cyan-deep"
                  }`}
                >
                  {i.precisa_repor ? "Tirar" : "Acabou"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {!todos && insumos.length > 0 && (
        <>
          <div className="nao-imprimir fixed inset-x-0 bottom-16 z-10 px-4 pb-3">
            <div className="mx-auto max-w-2xl">
              <Link
                href="/insumos/comprar"
                className="flex h-14 items-center justify-center rounded-xl bg-cyan-deep font-display text-base font-semibold text-white shadow-lg shadow-navy/20"
              >
                Registrar compra
              </Link>
            </div>
          </div>
          <div className="h-20" aria-hidden />
        </>
      )}
    </div>
  );
}
