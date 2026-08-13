"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { EstadoServico } from "@/lib/tipos";

function texto(form: FormData, campo: string) {
  const v = String(form.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

function numero(form: FormData, campo: string) {
  const bruto = String(form.get(campo) ?? "0").replace(",", ".");
  const n = Number(bruto);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Cria ou atualiza um tipo de serviço.
 *
 * É cadastro e não enum (ADR 0008): a variedade de serviços de uma
 * assistência é grande demais pra ser conhecida de antemão, e serviço novo
 * não pode custar deploy.
 */
export async function salvarServico(
  _anterior: EstadoServico,
  form: FormData,
): Promise<EstadoServico> {
  const id = texto(form, "id");
  const nome = texto(form, "nome");
  const categoria = texto(form, "categoria");

  if (!nome) return { erro: "Dê um nome ao serviço." };
  if (!categoria) return { erro: "Escolha ou crie uma categoria." };

  const valorPadrao = numero(form, "valor_padrao");
  if (valorPadrao === null) return { erro: "Valor padrão inválido." };

  const garantia = numero(form, "garantia_dias_padrao");
  if (garantia === null) return { erro: "Prazo de garantia inválido." };

  const dados = {
    nome,
    // Minúscula pra "Celular" e "celular" não virarem duas abas na landing.
    categoria: categoria.toLowerCase(),
    valor_padrao: valorPadrao,
    garantia_dias_padrao: Math.round(garantia),
    ativo: form.get("ativo") !== null,
  };

  const supabase = await createClient();

  if (id) {
    const { error } = await supabase
      .from("tipos_servico")
      .update(dados)
      .eq("id", id);
    if (error) return { erro: "Não foi possível salvar." };
  } else {
    const { error } = await supabase.from("tipos_servico").insert(dados);
    if (error) return { erro: "Não foi possível cadastrar." };
  }

  // Mudar o padrão aqui não altera OS já abertas: os valores são copiados
  // para os_servicos na criação. Garantia prometida não muda depois.
  revalidatePath("/servicos");
  revalidatePath("/os/nova");
  redirect("/servicos");
}

export async function apagarServico(form: FormData) {
  const id = String(form.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase.from("tipos_servico").delete().eq("id", id);

  // os_servicos referencia com `on delete restrict`: apagar um tipo já usado
  // arrancaria o serviço de OS antigas. Desativar é o caminho certo.
  if (error) redirect(`/servicos/${id}?erro=em-uso`);

  revalidatePath("/servicos");
  redirect("/servicos");
}
