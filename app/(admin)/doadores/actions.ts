"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { TIPOS_APARELHO, type TipoAparelho } from "@/lib/tipos";
import type { EstadoDoador } from "@/lib/doador";

function texto(form: FormData, campo: string) {
  const v = String(form.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

export async function salvarDoador(
  _anterior: EstadoDoador,
  form: FormData,
): Promise<EstadoDoador> {
  const id = texto(form, "id");
  const modelo = texto(form, "modelo");

  // O modelo é a identidade do doador: sem ele o registro não responde à
  // única pergunta que se faz na gaveta.
  if (!modelo) return { erro: "Diga o modelo do aparelho." };

  const tipo = texto(form, "tipo");
  if (tipo && !TIPOS_APARELHO.includes(tipo as TipoAparelho)) {
    return { erro: "Tipo de aparelho inválido." };
  }

  const dados = {
    modelo,
    marca: texto(form, "marca"),
    tipo,
    identificador: texto(form, "identificador"),
    anotacoes: texto(form, "anotacoes"),
    esgotado: form.get("esgotado") !== null,
  };

  const supabase = await createClient();

  if (id) {
    const { error } = await supabase
      .from("aparelhos_doadores")
      .update(dados)
      .eq("id", id);
    if (error) return { erro: "Não foi possível salvar." };
  } else {
    const { error } = await supabase.from("aparelhos_doadores").insert(dados);
    if (error) return { erro: "Não foi possível cadastrar." };
  }

  revalidatePath("/doadores");
  redirect("/doadores");
}

/** Terminal, mas reversível: aparelho some da busca sem sumir do sistema. */
export async function alternarEsgotado(form: FormData) {
  const id = String(form.get("id") ?? "");
  const esgotado = String(form.get("esgotado") ?? "") === "true";
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("aparelhos_doadores").update({ esgotado }).eq("id", id);

  revalidatePath("/doadores");
}

export async function apagarDoador(form: FormData) {
  const id = String(form.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("aparelhos_doadores").delete().eq("id", id);

  revalidatePath("/doadores");
  redirect("/doadores");
}
