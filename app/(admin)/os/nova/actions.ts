"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { soDigitos } from "@/lib/formato";
import {
  TIPOS_APARELHO,
  TIPOS_SENHA,
  type EstadoOS,
  type TipoAparelho,
  type TipoSenha,
} from "@/lib/tipos";

type ServicoEscolhido = {
  tipo_servico_id: string;
  valor: number;
  garantia_dias: number;
};

function texto(form: FormData, campo: string) {
  const v = String(form.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

const marcado = (form: FormData, campo: string) => form.get(campo) !== null;

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

  // Cliente: usa o existente se foi escolhido, senão cadastra o que foi
  // digitado. Cliente novo é o caso comum no balcão.
  let clienteId = texto(form, "cliente_id");
  if (!clienteId) {
    const nome = texto(form, "cliente_nome");
    if (!nome) {
      return { erro: "Informe o nome do cliente." };
    }
    const tel = texto(form, "cliente_telefone");
    const cpf = texto(form, "cliente_cpf");
    const { data: cliente, error } = await supabase
      .from("clientes")
      .insert({
        nome,
        telefone: tel ? soDigitos(tel) : null,
        cpf: cpf ? soDigitos(cpf) : null,
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

  const senhaInformada = texto(form, "senha_tipo");
  const senhaTipo =
    senhaInformada && TIPOS_SENHA.includes(senhaInformada as TipoSenha)
      ? (senhaInformada as TipoSenha)
      : null;

  const { data: os, error: erroOS } = await supabase
    .from("ordens_servico")
    .insert({
      cliente_id: clienteId,
      // Aparelho é opcional: existe OS sem aparelho (ADR 0007).
      aparelho_tipo: aparelhoTipo,
      aparelho_marca: aparelhoTipo ? texto(form, "aparelho_marca") : null,
      aparelho_modelo: aparelhoTipo ? texto(form, "aparelho_modelo") : null,
      aparelho_identificador: aparelhoTipo
        ? texto(form, "aparelho_identificador")
        : null,
      senha_tipo: aparelhoTipo ? senhaTipo : null,
      senha_aparelho:
        aparelhoTipo && senhaTipo !== "sem_senha"
          ? texto(form, "senha_aparelho")
          : null,
      // Registram que não deu para verificar, e não que faltou preencher.
      marca_nao_identificada:
        !!aparelhoTipo && marcado(form, "marca_nao_identificada"),
      modelo_nao_identificado:
        !!aparelhoTipo && marcado(form, "modelo_nao_identificado"),
      identificador_nao_identificado:
        !!aparelhoTipo && marcado(form, "identificador_nao_identificado"),
      solicitacao,
      // Peça não entra na abertura: o custo só existe depois do diagnóstico.
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
