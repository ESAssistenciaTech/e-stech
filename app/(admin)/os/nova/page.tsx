import { createClient } from "@/lib/supabase/server";
import type { TipoServico } from "@/lib/tipos";
import { FormularioNovaOS } from "./formulario";

export default async function NovaOSPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tipos_servico")
    .select("*")
    .eq("ativo", true)
    .order("categoria")
    .order("nome");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 font-display text-2xl font-bold text-navy">Nova OS</h1>
      <FormularioNovaOS tipos={(data ?? []) as TipoServico[]} />
    </div>
  );
}
