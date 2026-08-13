import { createClient } from "@/lib/supabase/server";
import type { Marca, TipoServico } from "@/lib/tipos";
import { FormularioNovaOS } from "./formulario";

export default async function NovaOSPage() {
  const supabase = await createClient();

  const [{ data: tipos }, { data: marcas }] = await Promise.all([
    supabase
      .from("tipos_servico")
      .select("*")
      .eq("ativo", true)
      .order("categoria")
      .order("nome"),
    supabase.from("marcas").select("*").eq("ativa", true).order("nome"),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 font-display text-2xl font-bold text-navy">Nova OS</h1>
      <FormularioNovaOS
        tipos={(tipos ?? []) as TipoServico[]}
        marcas={(marcas ?? []) as Marca[]}
      />
    </div>
  );
}
