import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Fornecedor, Qualidade } from "@/lib/cotacao";
import { FormularioCotacao } from "./formulario";

export default async function NovaCotacaoPage() {
  const supabase = await createClient();

  const [{ data: fornecedores }, { data: qualidades }] = await Promise.all([
    supabase.from("fornecedores").select("*").eq("ativo", true).order("nome"),
    supabase.from("qualidades").select("*").eq("ativa", true).order("ordem"),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/cotacoes" className="text-sm font-medium text-cyan-deep">
        ← Cotações
      </Link>
      <h1 className="mb-1 mt-2 font-display text-2xl font-bold text-navy">
        Registrar cotação
      </h1>
      <p className="mb-4 text-sm text-mute">
        Pergunte a todos e anote de uma vez. Da próxima vez que pedirem essa
        peça, você já chega com um número.
      </p>

      <FormularioCotacao
        fornecedores={(fornecedores ?? []) as Fornecedor[]}
        qualidades={(qualidades ?? []) as Qualidade[]}
      />
    </div>
  );
}
