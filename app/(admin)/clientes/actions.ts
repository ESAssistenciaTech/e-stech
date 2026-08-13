"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { soDigitos } from "@/lib/formato";

import type { EstadoCliente } from "@/lib/tipos";

function texto(form: FormData, campo: string) {
  const v = String(form.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

/**
 * Cria ou atualiza um cliente.
 *
 * Só o nome é obrigatório. Não existe constraint única em CPF, telefone ou
 * email, e não é pra existir — ver ADR 0004. Duplicata se evita com busca
 * boa na hora de abrir a OS, não travando o cadastro no balcão.
 */
export async function salvarCliente(
  _anterior: EstadoCliente,
  form: FormData,
): Promise<EstadoCliente> {
  const id = texto(form, "id");
  const nome = texto(form, "nome");

  if (!nome) {
    return { erro: "O nome é obrigatório." };
  }

  const telefoneBruto = texto(form, "telefone");
  const dados = {
    nome,
    // Guardamos só dígitos; a máscara é coisa de exibição.
    telefone: telefoneBruto ? soDigitos(telefoneBruto) : null,
    email: texto(form, "email"),
    cpf: texto(form, "cpf") ? soDigitos(texto(form, "cpf")!) : null,
    observacoes: texto(form, "observacoes"),
  };

  const supabase = await createClient();

  if (id) {
    const { error } = await supabase.from("clientes").update(dados).eq("id", id);
    if (error) return { erro: "Não foi possível salvar." };
    revalidatePath(`/clientes/${id}`);
    revalidatePath("/clientes");
    redirect(`/clientes/${id}`);
  }

  const { data, error } = await supabase
    .from("clientes")
    .insert(dados)
    .select("id")
    .single();

  if (error || !data) return { erro: "Não foi possível cadastrar." };

  revalidatePath("/clientes");
  redirect(`/clientes/${data.id}`);
}

export async function apagarCliente(form: FormData) {
  const id = String(form.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase.from("clientes").delete().eq("id", id);

  // A FK de ordens_servico é `on delete restrict`: apagar o cliente
  // arrastaria o histórico de OS junto, então o banco barra.
  if (error) {
    redirect(`/clientes/${id}?erro=tem-os`);
  }

  revalidatePath("/clientes");
  redirect("/clientes");
}
