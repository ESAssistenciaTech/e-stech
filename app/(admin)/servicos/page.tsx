import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { moeda } from "@/lib/formato";
import type { TipoServico } from "@/lib/tipos";

export default async function ServicosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tipos_servico")
    .select("*")
    .order("categoria")
    .order("nome");

  const tipos = (data ?? []) as TipoServico[];

  const porCategoria = new Map<string, TipoServico[]>();
  for (const t of tipos) {
    const lista = porCategoria.get(t.categoria) ?? [];
    lista.push(t);
    porCategoria.set(t.categoria, lista);
  }

  const semValor = tipos.filter((t) => t.ativo && Number(t.valor_padrao) === 0);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-2xl font-bold text-navy">Serviços</h1>
        <Link
          href="/servicos/novo"
          className="ml-auto flex h-11 items-center rounded-lg bg-cyan-deep px-4 font-display text-sm font-semibold text-white hover:bg-navy"
        >
          Novo
        </Link>
      </div>

      {semValor.length > 0 && (
        <p className="rounded-xl border border-amber/40 bg-amber/10 p-3 text-sm text-ink">
          {semValor.length === 1
            ? "1 serviço ativo está com valor zerado"
            : `${semValor.length} serviços ativos estão com valor zerado`}
          . Enquanto estiver assim, a OS nasce sem preço e você digita tudo à
          mão.
        </p>
      )}

      {tipos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-white p-8 text-center">
          <p className="mb-4 text-mute">Nenhum serviço cadastrado.</p>
          <Link
            href="/servicos/novo"
            className="inline-flex h-11 items-center rounded-lg bg-cyan-deep px-4 font-display text-sm font-semibold text-white"
          >
            Cadastrar o primeiro
          </Link>
        </div>
      ) : (
        [...porCategoria.entries()].map(([categoria, lista]) => (
          <section key={categoria}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-mute">
              {categoria}
            </h2>
            <ul className="flex flex-col gap-2">
              {lista.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/servicos/${t.id}`}
                    className={`flex min-h-14 items-center gap-3 rounded-lg border bg-white px-4 py-3 hover:border-cyan-deep ${
                      t.ativo ? "border-line" : "border-dashed border-line"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate font-medium ${
                          t.ativo ? "text-ink" : "text-mute line-through"
                        }`}
                      >
                        {t.nome}
                      </p>
                      <p className="dado text-xs text-mute">
                        {t.garantia_dias_padrao > 0
                          ? `${t.garantia_dias_padrao} dias de garantia`
                          : "sem garantia"}
                      </p>
                    </div>
                    <span
                      className={`dado shrink-0 font-semibold ${
                        Number(t.valor_padrao) === 0 && t.ativo
                          ? "text-amber"
                          : "text-navy"
                      }`}
                    >
                      {moeda(t.valor_padrao)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
