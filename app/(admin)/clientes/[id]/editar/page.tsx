import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Cliente } from "@/lib/tipos";
import { FormularioCliente } from "../../formulario";

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: cliente } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!cliente) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link
        href={`/clientes/${id}`}
        className="text-sm font-medium text-cyan-deep"
      >
        ← {(cliente as Cliente).nome}
      </Link>
      <h1 className="font-display text-2xl font-bold text-navy">
        Editar cliente
      </h1>
      <FormularioCliente cliente={cliente as Cliente} />
    </div>
  );
}
