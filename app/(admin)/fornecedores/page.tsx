import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { telefone } from "@/lib/formato";
import type { Fornecedor } from "@/lib/cotacao";

export default async function FornecedoresPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("fornecedores")
    .select("*")
    .order("ativo", { ascending: false })
    .order("nome");

  const fornecedores = (data ?? []) as Fornecedor[];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link href="/cotacoes" className="text-sm font-medium text-cyan-deep">
        ← Cotações
      </Link>

      <div className="flex items-center gap-3">
        <h1 className="font-display text-2xl font-bold text-navy">
          Fornecedores
        </h1>
        <Link
          href="/fornecedores/novo"
          className="ml-auto flex h-11 items-center rounded-lg bg-cyan-deep px-4 font-display text-sm font-semibold text-white"
        >
          Novo
        </Link>
      </div>

      {fornecedores.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-white px-6 py-12 text-center">
          <p className="mb-1 font-display text-lg font-semibold text-navy">
            Nenhum fornecedor
          </p>
          <p className="mb-5 text-sm text-mute">
            Cadastre quem você chama no WhatsApp para perguntar preço de peça.
          </p>
          <Link
            href="/fornecedores/novo"
            className="inline-flex h-12 items-center rounded-lg bg-cyan-deep px-5 font-display font-semibold text-white"
          >
            Cadastrar o primeiro
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {fornecedores.map((f) => (
            <li key={f.id}>
              <Link
                href={`/fornecedores/${f.id}`}
                className={`flex min-h-14 items-center gap-3 rounded-lg border bg-white px-4 py-3 hover:border-cyan-deep ${
                  f.ativo ? "border-line" : "border-dashed border-line"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate font-medium ${
                      f.ativo ? "text-ink" : "text-mute line-through"
                    }`}
                  >
                    {f.nome}
                  </p>
                  {f.observacoes && (
                    <p className="truncate text-xs text-mute">{f.observacoes}</p>
                  )}
                </div>
                <span className="dado shrink-0 text-sm text-mute">
                  {telefone(f.telefone)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
