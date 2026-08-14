import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Insumo } from "@/lib/insumo";
import { FormularioCompra } from "./formulario";

/**
 * Reabastecimento.
 *
 * Sobe a quantidade e lança a saída no caixa no mesmo ato — nunca em telas
 * separadas. Separar garante que um dia um é feito e o outro esquecido, e aí
 * ou o caixa mente ou o estoque mente. Ver CONTEXT.md, "Compra de insumo".
 */
export default async function ComprarPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("insumos")
    .select("*")
    .eq("precisa_repor", true)
    .eq("ativo", true)
    .order("nome");

  const insumos = (data ?? []) as Insumo[];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link href="/insumos" className="text-sm font-medium text-cyan-deep">
        ← Lista de compras
      </Link>
      <h1 className="font-display text-2xl font-bold text-navy">
        Registrar compra
      </h1>

      {insumos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-white px-6 py-12 text-center">
          <p className="mb-1 font-display text-lg font-semibold text-navy">
            Lista vazia
          </p>
          <p className="mb-5 text-sm text-mute">
            Nada marcado para comprar. Marque na lista de insumos.
          </p>
          <Link
            href="/insumos?ver=todos"
            className="inline-flex h-12 items-center rounded-lg bg-cyan-deep px-5 font-display font-semibold text-white"
          >
            Ver todos os insumos
          </Link>
        </div>
      ) : (
        <FormularioCompra insumos={insumos} />
      )}
    </div>
  );
}
