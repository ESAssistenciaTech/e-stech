import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FormularioDoador } from "../formulario";

export default async function NovoDoadorPage() {
  const supabase = await createClient();
  const { data: marcas } = await supabase
    .from("marcas")
    .select("nome")
    .eq("ativa", true)
    .order("nome");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link href="/doadores" className="text-sm font-medium text-cyan-deep">
        ← Doadores
      </Link>
      <h1 className="font-display text-2xl font-bold text-navy">
        Guardar aparelho
      </h1>
      <p className="-mt-3 text-sm text-mute">
        Um registro por aparelho, mesmo se você tiver dois iguais: cada um vai
        ficar num estado diferente de canibalização.
      </p>

      <FormularioDoador marcas={(marcas ?? []).map((m) => m.nome)} />
    </div>
  );
}
