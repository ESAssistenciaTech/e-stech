"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { TIPOS_APARELHO, type EstadoOSEdicao, type TipoAparelho } from "@/lib/tipos";

type ServicoEnviado = {
  /** Ausente quando a linha foi adicionada agora. */
  id?: string;
  tipo_servico_id: string;
  valor: number;
  garantia_dias: number;
};

function texto(form: FormData, campo: string) {
  const v = String(form.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

function dinheiro(form: FormData, campo: string) {
  const n = Number(String(form.get(campo) ?? "0").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Atualiza uma OS já aberta.
 *
 * O status NÃO passa por aqui — ele tem ação própria, porque muda datas por
 * trigger e pode disparar estorno. Misturar os dois faria uma edição de
 * texto gravar data de entrega sem querer.
 */
export async function atualizarOS(
  _anterior: EstadoOSEdicao,
  form: FormData,
): Promise<EstadoOSEdicao> {
  const id = String(form.get("id") ?? "");
  if (!id) return { erro: "OS não identificada." };

  const solicitacao = texto(form, "solicitacao");
  if (!solicitacao) return { erro: "A solicitação não pode ficar vazia." };

  const clienteId = texto(form, "cliente_id");
  if (!clienteId) return { erro: "A OS precisa de um cliente." };

  const valorPeca = dinheiro(form, "valor_peca");
  const custoPeca = dinheiro(form, "custo_peca");
  if (valorPeca === null || custoPeca === null) {
    return { erro: "Valor ou custo de peça inválido." };
  }

  let servicos: ServicoEnviado[];
  try {
    servicos = JSON.parse(String(form.get("servicos") ?? "[]"));
  } catch {
    return { erro: "Não foi possível ler os serviços." };
  }
  if (servicos.length === 0) {
    return { erro: "A OS precisa de pelo menos um serviço." };
  }

  const tipoInformado = texto(form, "aparelho_tipo");
  const aparelhoTipo =
    tipoInformado && TIPOS_APARELHO.includes(tipoInformado as TipoAparelho)
      ? (tipoInformado as TipoAparelho)
      : null;

  const supabase = await createClient();

  const { error: erroOS } = await supabase
    .from("ordens_servico")
    .update({
      cliente_id: clienteId,
      aparelho_tipo: aparelhoTipo,
      aparelho_marca: aparelhoTipo ? texto(form, "aparelho_marca") : null,
      aparelho_modelo: aparelhoTipo ? texto(form, "aparelho_modelo") : null,
      aparelho_identificador: aparelhoTipo
        ? texto(form, "aparelho_identificador")
        : null,
      senha_aparelho: aparelhoTipo ? texto(form, "senha_aparelho") : null,
      solicitacao,
      diagnostico: texto(form, "diagnostico"),
      servico_realizado: texto(form, "servico_realizado"),
      valor_peca: valorPeca,
      custo_peca: custoPeca,
    })
    .eq("id", id);

  if (erroOS) return { erro: "Não foi possível salvar a OS." };

  // Serviços por diferença, não apagando tudo e reinserindo: se a inserção
  // falhasse no meio, a OS ficaria sem serviço nenhum.
  const { data: atuais } = await supabase
    .from("os_servicos")
    .select("id")
    .eq("ordem_servico_id", id);

  const enviadosComId = new Set(
    servicos.map((s) => s.id).filter(Boolean) as string[],
  );
  const removidos = (atuais ?? [])
    .map((s) => s.id)
    .filter((idAtual) => !enviadosComId.has(idAtual));

  for (const s of servicos.filter((s) => s.id)) {
    const { error } = await supabase
      .from("os_servicos")
      .update({
        tipo_servico_id: s.tipo_servico_id,
        valor: s.valor,
        garantia_dias: s.garantia_dias,
      })
      .eq("id", s.id!);
    if (error) return { erro: "Não foi possível atualizar os serviços." };
  }

  const novos = servicos.filter((s) => !s.id);
  if (novos.length > 0) {
    const { error } = await supabase.from("os_servicos").insert(
      novos.map((s) => ({
        ordem_servico_id: id,
        tipo_servico_id: s.tipo_servico_id,
        valor: s.valor,
        garantia_dias: s.garantia_dias,
      })),
    );
    if (error) return { erro: "Não foi possível adicionar os serviços novos." };
  }

  // Só depois que os novos entraram: assim a OS nunca fica sem serviço.
  if (removidos.length > 0) {
    const { error } = await supabase
      .from("os_servicos")
      .delete()
      .in("id", removidos);
    if (error) return { erro: "Não foi possível remover os serviços." };
  }

  revalidatePath(`/os/${id}`);
  revalidatePath("/os");
  revalidatePath("/dashboard");
  redirect(`/os/${id}`);
}
