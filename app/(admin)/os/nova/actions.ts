"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { soDigitos } from "@/lib/formato";
import { TIPOS_APARELHO, type TipoAparelho } from "@/lib/tipos";

export type EstadoOS = { erro: string | null };

type ServicoEscolhido = {
  tipo_servico_id: string;
  valor: number;
  garantia_dias: number;
};

function texto(form: FormData, campo: string) {
  const v = String(form.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

export async function criarOS(
  _anterior: EstadoOS,
  form: FormData,
): Promise<EstadoOS> {
  const supabase = await createClient();

  const solicitacao = texto(form, "solicitacao");
  if (!solicitacao) {
    return { erro: "Descreva o que o cliente pediu." };
  }

  let servicos: ServicoEscolhido[];
  try {
    servicos = JSON.parse(String(form.get("servicos") ?? "[]"));
  } catch {
    return { erro: "Não foi possível ler os serviços escolhidos." };
  }
  if (servicos.length === 0) {
    return { erro: "Escolha pelo menos um serviço." };
  }

  // Cliente: usa o existente se foi escolhido na busca, senão cria.
  let clienteId = texto(form, "cliente_id");
  if (!clienteId) {
    const nome = texto(form, "cliente_nome");
    if (!nome) {
      return { erro: "Escolha um cliente ou informe o nome de um novo." };
    }
    const telefoneNovo = texto(form, "cliente_telefone");
    const { data: cliente, error } = await supabase
      .from("clientes")
      .insert({
        nome,
        telefone: telefoneNovo ? soDigitos(telefoneNovo) : null,
      })
      .select("id")
      .single();

    if (error || !cliente) {
      return { erro: "Não foi possível salvar o cliente." };
    }
    clienteId = cliente.id;
  }

  const tipoInformado = texto(form, "aparelho_tipo");
  const aparelhoTipo =
    tipoInformado && TIPOS_APARELHO.includes(tipoInformado as TipoAparelho)
      ? (tipoInformado as TipoAparelho)
      : null;

  const { data: os, error: erroOS } = await supabase
    .from("ordens_servico")
    .insert({
      cliente_id: clienteId,
      // Aparelho é opcional: existe OS sem aparelho (ADR 0007).
      aparelho_tipo: aparelhoTipo,
      aparelho_marca: texto(form, "aparelho_marca"),
      aparelho_modelo: texto(form, "aparelho_modelo"),
      aparelho_identificador: texto(form, "aparelho_identificador"),
      senha_aparelho: texto(form, "senha_aparelho"),
      solicitacao,
      valor_peca: Number(form.get("valor_peca") ?? 0) || 0,
      custo_peca: Number(form.get("custo_peca") ?? 0) || 0,
    })
    .select("id")
    .single();

  if (erroOS || !os) {
    return { erro: "Não foi possível abrir a ordem de serviço." };
  }

  const { error: erroServicos } = await supabase.from("os_servicos").insert(
    servicos.map((s) => ({
      ordem_servico_id: os.id,
      tipo_servico_id: s.tipo_servico_id,
      valor: s.valor,
      garantia_dias: s.garantia_dias,
    })),
  );

  if (erroServicos) {
    // A OS sem serviço nenhum não serve pra nada e ainda suja a lista.
    await supabase.from("ordens_servico").delete().eq("id", os.id);
    return { erro: "Não foi possível salvar os serviços. Tente de novo." };
  }

  revalidatePath("/os");
  redirect(`/os/${os.id}`);
}
