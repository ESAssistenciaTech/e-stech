import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { descrever, type Doador } from "@/lib/doador";
import { ROTULO_IDENTIFICADOR, type TipoAparelho } from "@/lib/tipos";
import { alternarEsgotado } from "./actions";

type Params = { searchParams: Promise<{ q?: string; ver?: string }> };

/**
 * A gaveta dos doadores.
 *
 * A pergunta que se faz aqui é uma só — "tenho um desse modelo?" —, então a
 * tela é uma busca com resposta, não um inventário para navegar. O que já foi
 * arrancado aparece junto: um doador sem a tela não serve para quem precisa
 * de tela, e descobrir isso só na gaveta é perder a viagem.
 */
export default async function DoadoresPage({ searchParams }: Params) {
  const { q, ver } = await searchParams;
  const busca = (q ?? "").trim();
  const comEsgotados = ver === "todos";

  const supabase = await createClient();

  let consulta = supabase
    .from("aparelhos_doadores")
    .select("*")
    .order("modelo")
    .limit(100);

  if (!comEsgotados) consulta = consulta.eq("esgotado", false);
  if (busca.length >= 2) {
    const alvo = `%${busca}%`;
    consulta = consulta.or(
      `modelo.ilike.${alvo},marca.ilike.${alvo},identificador.ilike.${alvo},anotacoes.ilike.${alvo}`,
    );
  }

  const { data } = await consulta;
  const doadores = (data ?? []) as Doador[];

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <header className="mb-4 flex items-center gap-3">
        <h1 className="font-display text-3xl font-bold tracking-tight text-navy">
          Doadores
        </h1>
        <Link
          href="/cotacoes"
          className="ml-auto text-sm font-medium text-cyan-deep"
        >
          Cotações
        </Link>
      </header>

      <form className="mb-3 flex gap-2">
        {comEsgotados && <input type="hidden" name="ver" value="todos" />}
        <input
          name="q"
          defaultValue={busca}
          placeholder="Que modelo você precisa?"
          className="h-12 min-w-0 flex-1 rounded-lg border border-line bg-white px-3 text-base outline-none focus:border-cyan-deep"
        />
        <button
          type="submit"
          className="h-12 shrink-0 rounded-lg border border-line px-4 font-medium text-navy"
        >
          Buscar
        </button>
      </form>

      <div className="mb-4 flex gap-2">
        {[
          {
            rotulo: "Na gaveta",
            href: busca ? `/doadores?q=${encodeURIComponent(busca)}` : "/doadores",
            ativo: !comEsgotados,
          },
          {
            rotulo: "Com os esgotados",
            href: busca
              ? `/doadores?ver=todos&q=${encodeURIComponent(busca)}`
              : "/doadores?ver=todos",
            ativo: comEsgotados,
          },
        ].map((f) => (
          <Link
            key={f.rotulo}
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

      {doadores.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-white px-6 py-12 text-center">
          <p className="mb-1 font-display text-lg font-semibold text-navy">
            {busca ? "Não tem desse" : "Gaveta vazia"}
          </p>
          <p className="mb-5 text-sm text-mute">
            {busca
              ? "Nenhum doador com esse modelo. Cote a peça com os fornecedores."
              : "Aparelho que fica guardado para arrancar peça entra aqui."}
          </p>
          <Link
            href={busca ? "/cotacoes" : "/doadores/novo"}
            className="inline-flex h-12 items-center rounded-lg bg-cyan-deep px-5 font-display font-semibold text-white"
          >
            {busca ? "Ir para cotações" : "Guardar o primeiro"}
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {doadores.map((d) => (
            <li
              key={d.id}
              className={`flex items-stretch overflow-hidden rounded-lg border bg-white ${
                d.esgotado ? "border-dashed border-line" : "border-line"
              }`}
            >
              <Link
                href={`/doadores/${d.id}`}
                className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-4 py-3"
              >
                <p
                  className={`truncate font-medium ${
                    d.esgotado ? "text-mute line-through" : "text-ink"
                  }`}
                >
                  {descrever(d)}
                </p>
                {d.anotacoes && (
                  <p className="truncate text-xs text-mute">{d.anotacoes}</p>
                )}
                {d.identificador && (
                  <p className="dado truncate text-xs text-mute">
                    {d.tipo
                      ? ROTULO_IDENTIFICADOR[d.tipo as TipoAparelho]
                      : "Identificação"}{" "}
                    {d.identificador}
                  </p>
                )}
              </Link>

              <form action={alternarEsgotado} className="flex">
                <input type="hidden" name="id" value={d.id} />
                <input
                  type="hidden"
                  name="esgotado"
                  value={d.esgotado ? "false" : "true"}
                />
                <button
                  type="submit"
                  className={`min-w-24 border-l border-line px-4 text-sm font-medium ${
                    d.esgotado ? "text-cyan-deep" : "text-mute"
                  }`}
                >
                  {d.esgotado ? "Voltar" : "Esgotou"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <div className="nao-imprimir fixed inset-x-0 bottom-16 z-10 px-4 pb-3">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/doadores/novo"
            className="flex h-14 items-center justify-center rounded-xl bg-cyan-deep font-display text-base font-semibold text-white shadow-lg shadow-navy/20"
          >
            Guardar aparelho
          </Link>
        </div>
      </div>
    </div>
  );
}
