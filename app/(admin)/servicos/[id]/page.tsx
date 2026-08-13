import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { TipoServico } from "@/lib/tipos";
import { FormularioServico } from "../formulario";
import { apagarServico } from "../actions";

type Params = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
};

export default async function EditarServicoPage({
  params,
  searchParams,
}: Params) {
  const { id } = await params;
  const { erro } = await searchParams;
  const supabase = await createClient();

  const [{ data: servico }, { data: todas }, { count: usos }] =
    await Promise.all([
      supabase.from("tipos_servico").select("*").eq("id", id).maybeSingle(),
      supabase.from("tipos_servico").select("categoria"),
      supabase
        .from("os_servicos")
        .select("id", { count: "exact", head: true })
        .eq("tipo_servico_id", id),
    ]);

  if (!servico) notFound();

  const categorias = [...new Set((todas ?? []).map((t) => t.categoria))].sort();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link href="/servicos" className="text-sm font-medium text-cyan-deep">
        ← Serviços
      </Link>
      <h1 className="font-display text-2xl font-bold text-navy">
        Editar serviço
      </h1>

      {erro === "em-uso" && (
        <p
          role="alert"
          className="rounded-xl border border-line bg-white p-4 text-sm text-status-recusado"
        >
          Esse serviço já foi usado em OS. Apagar arrancaria o serviço do
          histórico delas — o banco não deixa. Desmarque &quot;Ativo&quot; para
          tirá-lo da abertura de OS sem mexer no passado.
        </p>
      )}

      <FormularioServico
        servico={servico as TipoServico}
        categorias={categorias}
      />

      {usos === 0 && (
        <form action={apagarServico} className="pt-2">
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            className="h-11 w-full rounded-lg border border-status-recusado/40 text-sm font-medium text-status-recusado"
          >
            Apagar serviço
          </button>
        </form>
      )}

      {usos !== null && usos > 0 && (
        <p className="px-1 text-xs text-mute">
          Usado em {usos} {usos === 1 ? "ordem" : "ordens"} de serviço. Para
          aposentar, desmarque &quot;Ativo&quot;.
        </p>
      )}
    </div>
  );
}
