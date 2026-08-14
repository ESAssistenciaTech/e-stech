"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { apagarImagens, listarImagens } from "@/lib/cloudinary";

/**
 * Apaga as fotos das OS marcadas — banco e nuvem.
 *
 * Em lote porque é assim que a limpeza acontece de verdade: uma vez a cada
 * muitos meses, olhando a lista inteira. Apagar de uma em uma garante que
 * ninguém faz.
 */
export async function apagarFotosDasOrdens(form: FormData) {
  const ids = form.getAll("os").map(String).filter(Boolean);
  if (ids.length === 0) return;

  const supabase = await createClient();

  const { data: fotos } = await supabase
    .from("os_fotos")
    .select("id, public_id")
    .in("ordem_servico_id", ids);

  if (!fotos || fotos.length === 0) return;

  // Primeiro o banco. Se a nuvem falhar, sobra arquivo órfão — que esta
  // mesma tela mostra e sabe limpar. Na ordem inversa, a falha deixaria a
  // linha apontando para uma imagem que não existe mais, e aí a tela da OS
  // mostra quadrado quebrado.
  const { error } = await supabase
    .from("os_fotos")
    .delete()
    .in("ordem_servico_id", ids);

  if (error) return;

  await apagarImagens(fotos.map((f) => f.public_id));

  revalidatePath("/fotos");
  for (const id of ids) {
    revalidatePath(`/os/${id}`);
    revalidatePath(`/os/${id}/fotos`);
  }
}

/**
 * Apaga o que está na nuvem e não está no banco.
 *
 * A lista é refeita aqui, do zero, em vez de vir do formulário: o que a tela
 * mostrou pode ter envelhecido, e apagar arquivo com base em identificador
 * que veio do navegador é confiar em quem não precisa ser confiado.
 */
export async function apagarOrfas() {
  const naNuvem = await listarImagens();
  if (!naNuvem || naNuvem.length === 0) return;

  const supabase = await createClient();
  const { data: registradas, error } = await supabase
    .from("os_fotos")
    .select("public_id");

  // Sem conseguir ler o banco, tudo pareceria órfão. Não apagar nada.
  if (error || !registradas) return;

  const conhecidas = new Set(registradas.map((f) => f.public_id));
  const orfas = naNuvem
    .filter((i) => !conhecidas.has(i.publicId))
    .map((i) => i.publicId);

  await apagarImagens(orfas);

  revalidatePath("/fotos");
}
