import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Fornecedor } from "@/lib/cotacao";
import { FormularioFornecedor } from "../formulario";

export default async function EditarFornecedorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("fornecedores")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link href="/fornecedores" className="text-sm font-medium text-cyan-deep">
        ← Fornecedores
      </Link>
      <h1 className="font-display text-2xl font-bold text-navy">
        Editar fornecedor
      </h1>
      <FormularioFornecedor fornecedor={data as Fornecedor} />
    </div>
  );
}
