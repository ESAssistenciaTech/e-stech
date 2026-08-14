import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Insumo } from "@/lib/insumo";
import { FormularioInsumo } from "../formulario";
import { apagarInsumo } from "../actions";

export default async function EditarInsumoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: insumo } = await supabase
    .from("insumos")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!insumo) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link
        href="/insumos?ver=todos"
        className="text-sm font-medium text-cyan-deep"
      >
        ← Insumos
      </Link>
      <h1 className="font-display text-2xl font-bold text-navy">
        Editar insumo
      </h1>

      <FormularioInsumo insumo={insumo as Insumo} />

      {/* Nada referencia insumo ainda, então apagar é seguro. Quando a venda
          avulsa entrar (ADR 0005), isto passa a exigir a mesma conversa que
          existe em serviços: histórico não se arranca, se aposenta. */}
      <form action={apagarInsumo} className="pt-2">
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          className="h-11 w-full rounded-lg border border-status-recusado/40 text-sm font-medium text-status-recusado"
        >
          Apagar insumo
        </button>
      </form>
    </div>
  );
}
