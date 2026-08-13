"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { soDigitos } from "@/lib/formato";
import type { EstadoLoja } from "@/lib/tipos";

function texto(form: FormData, campo: string) {
  const v = String(form.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

/**
 * Salva os dados da loja.
 *
 * É registro único (a chave primária só aceita `true`), então a operação é
 * sempre update. Esses campos alimentam a landing, o PDF e as mensagens de
 * WhatsApp de uma vez — mudar o horário não pode exigir deploy nem alterar
 * o mesmo dado em três lugares.
 */
export async function salvarLoja(
  _anterior: EstadoLoja,
  form: FormData,
): Promise<EstadoLoja> {
  const nome = texto(form, "nome");
  if (!nome) return { erro: "A loja precisa de um nome.", ok: false };

  const telefoneBruto = texto(form, "telefone");

  const supabase = await createClient();
  const { error } = await supabase
    .from("dados_loja")
    .update({
      nome,
      endereco: texto(form, "endereco"),
      horario: texto(form, "horario"),
      telefone: telefoneBruto ? soDigitos(telefoneBruto) : null,
    })
    .eq("singleton", true);

  if (error) return { erro: "Não foi possível salvar.", ok: false };

  revalidatePath("/configuracoes");
  return { erro: null, ok: true };
}
