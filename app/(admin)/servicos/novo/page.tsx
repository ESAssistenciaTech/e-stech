import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FormularioServico } from "../formulario";

export default async function NovoServicoPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("tipos_servico").select("categoria");
  const categorias = [...new Set((data ?? []).map((t) => t.categoria))].sort();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link href="/servicos" className="text-sm font-medium text-cyan-deep">
        ← Serviços
      </Link>
      <h1 className="font-display text-2xl font-bold text-navy">Novo serviço</h1>
      <FormularioServico categorias={categorias} />
    </div>
  );
}
