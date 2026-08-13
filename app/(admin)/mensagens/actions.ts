"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SITUACOES, type Situacao } from "@/lib/mensagem";
import type { EstadoLoja } from "@/lib/tipos";

/**
 * Salva os modelos de mensagem.
 *
 * Grava todos de uma vez: são quatro campos numa tela só, e salvar um por
 * um faria quem ajustou o tom de dois textos apertar salvar duas vezes.
 */
export async function salvarMensagens(
  _anterior: EstadoLoja,
  form: FormData,
): Promise<EstadoLoja> {
  const supabase = await createClient();

  for (const situacao of SITUACOES) {
    const texto = String(form.get(situacao) ?? "").trim();
    if (!texto) {
      return { erro: `O texto de "${situacao}" não pode ficar vazio.`, ok: false };
    }

    const { error } = await supabase
      .from("modelos_mensagem")
      .upsert({ situacao, texto }, { onConflict: "situacao" });

    if (error) {
      return { erro: "Não foi possível salvar as mensagens.", ok: false };
    }
  }

  revalidatePath("/mensagens");
  return { erro: null, ok: true };
}

export type { Situacao };
