import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dataHora } from "@/lib/formato";
import type { Doador } from "@/lib/doador";
import { FormularioDoador } from "../formulario";
import { apagarDoador } from "../actions";

export default async function EditarDoadorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: doador }, { data: marcas }] = await Promise.all([
    supabase
      .from("aparelhos_doadores")
      .select("*")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("marcas").select("nome").eq("ativa", true).order("nome"),
  ]);

  if (!doador) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link href="/doadores" className="text-sm font-medium text-cyan-deep">
        ← Doadores
      </Link>
      <h1 className="font-display text-2xl font-bold text-navy">
        Editar doador
      </h1>

      <FormularioDoador
        doador={doador as Doador}
        marcas={(marcas ?? []).map((m) => m.nome)}
      />

      <p className="px-1 text-xs text-mute">
        Guardado em {dataHora(doador.criado_em)}.
      </p>

      {/* Nada referencia doador: a peça arrancada vira valor_peca na OS, não
          um vínculo. Apagar aqui não arranca nada de lugar nenhum. */}
      <form action={apagarDoador}>
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          className="h-11 w-full rounded-lg border border-status-recusado/40 text-sm font-medium text-status-recusado"
        >
          Apagar registro
        </button>
      </form>
    </div>
  );
}
