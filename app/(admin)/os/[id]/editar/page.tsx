import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { codigo } from "@/lib/formato";
import type { Cliente, OrdemServico, TipoServico } from "@/lib/tipos";
import { FormularioEditarOS } from "./formulario";

export default async function EditarOSPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: os }, { data: servicos }, { data: tipos }] = await Promise.all([
    supabase
      .from("ordens_servico")
      .select("*, clientes(*)")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("os_servicos")
      .select("id, tipo_servico_id, valor, garantia_dias, tipos_servico(nome)")
      .eq("ordem_servico_id", id)
      .order("criado_em"),
    supabase
      .from("tipos_servico")
      .select("*")
      .eq("ativo", true)
      .order("categoria")
      .order("nome"),
  ]);

  if (!os) notFound();

  const cliente = os.clientes as unknown as Cliente;

  const linhas = (servicos ?? []).map((s) => ({
    id: s.id,
    tipo_servico_id: s.tipo_servico_id,
    nome:
      (s.tipos_servico as unknown as { nome: string } | null)?.nome ??
      "Serviço removido",
    valor: Number(s.valor),
    garantia_dias: s.garantia_dias,
  }));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link href={`/os/${id}`} className="text-sm font-medium text-cyan-deep">
        ← {codigo(os.codigo_publico)}
      </Link>
      <h1 className="font-display text-2xl font-bold text-navy">Editar OS</h1>
      <p className="-mt-2 text-sm text-mute">
        O status muda na tela da OS, não aqui — ele grava datas e pode gerar
        estorno.
      </p>

      <FormularioEditarOS
        os={os as unknown as OrdemServico}
        cliente={cliente}
        servicos={linhas}
        tipos={(tipos ?? []) as TipoServico[]}
      />
    </div>
  );
}
