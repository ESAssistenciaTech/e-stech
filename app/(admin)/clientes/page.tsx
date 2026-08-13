import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { telefone } from "@/lib/formato";
import type { Cliente } from "@/lib/tipos";

type Params = { searchParams: Promise<{ q?: string }> };

export default async function ClientesPage({ searchParams }: Params) {
  const { q } = await searchParams;
  const busca = (q ?? "").trim();

  const supabase = await createClient();
  let query = supabase
    .from("clientes")
    .select("*")
    .order("nome")
    .limit(100);

  // Casa nome, telefone e CPF ao mesmo tempo: quem está no balcão lembra de
  // um dos três, não sabe qual foi cadastrado.
  if (busca.length >= 2) {
    const termo = `%${busca}%`;
    query = query.or(
      `nome.ilike.${termo},telefone.ilike.${termo},cpf.ilike.${termo}`,
    );
  }

  const { data: clientes } = await query;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-2xl font-bold text-navy">Clientes</h1>
        <Link
          href="/clientes/novo"
          className="ml-auto flex h-11 items-center rounded-lg bg-cyan-deep px-4 font-display text-sm font-semibold text-white hover:bg-navy"
        >
          Novo
        </Link>
      </div>

      {/* Busca por GET: funciona sem JS e o resultado fica linkável. */}
      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={busca}
          placeholder="Nome, telefone ou CPF"
          className="h-12 min-w-0 flex-1 rounded-lg border border-line bg-white px-3 text-base outline-none focus:border-cyan-deep"
        />
        <button
          type="submit"
          className="h-12 shrink-0 rounded-lg border border-line px-4 font-medium text-navy"
        >
          Buscar
        </button>
      </form>

      {!clientes || clientes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-white p-8 text-center">
          <p className="mb-4 text-mute">
            {busca ? `Ninguém encontrado para "${busca}".` : "Nenhum cliente ainda."}
          </p>
          <Link
            href="/clientes/novo"
            className="inline-flex h-11 items-center rounded-lg bg-cyan-deep px-4 font-display text-sm font-semibold text-white"
          >
            Cadastrar cliente
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {(clientes as Cliente[]).map((c) => (
            <li key={c.id}>
              <Link
                href={`/clientes/${c.id}`}
                className="flex min-h-14 items-center gap-3 rounded-lg border border-line bg-white px-4 py-3 hover:border-cyan-deep"
              >
                <span className="min-w-0 flex-1 truncate font-medium text-ink">
                  {c.nome}
                </span>
                <span className="dado shrink-0 text-sm text-mute">
                  {telefone(c.telefone)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
