"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type Assinatura = {
  assinatura: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  pasta: string;
};

/**
 * Assina um upload para o Cloudinary.
 *
 * O caminho alternativo seria um preset sem assinatura, mas o nome do preset
 * fica no JavaScript da página: qualquer visitante do site conseguiria subir
 * arquivo para a conta da loja. Aqui o servidor só assina para quem tem
 * sessão, e o segredo nunca sai daqui.
 */
export async function assinarUpload(
  ordemServicoId: string,
): Promise<Assinatura | { erro: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sessão expirada. Entre de novo." };

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return { erro: "Cloudinary não configurado. Falta preencher o .env." };
  }

  // Confere que a OS existe antes de assinar: assinatura solta viraria
  // permissão de upload sem destino.
  const { data: os } = await supabase
    .from("ordens_servico")
    .select("id")
    .eq("id", ordemServicoId)
    .maybeSingle();
  if (!os) return { erro: "Ordem de serviço não encontrada." };

  const timestamp = Math.floor(Date.now() / 1000);
  const pasta = `os/${ordemServicoId}`;

  // A assinatura é o SHA-1 dos parâmetros em ordem alfabética, seguidos do
  // segredo. Só o que está aqui pode ser enviado — mudar a pasta no cliente
  // invalida a assinatura.
  const paraAssinar = `folder=${pasta}&timestamp=${timestamp}${apiSecret}`;
  const assinatura = createHash("sha1").update(paraAssinar).digest("hex");

  return { assinatura, timestamp, apiKey, cloudName, pasta };
}

export type EstadoFoto = { erro: string | null };

export async function registrarFoto(dados: {
  ordemServicoId: string;
  momento: "entrada" | "entrega";
  url: string;
  publicId: string;
  largura: number;
  altura: number;
}): Promise<EstadoFoto> {
  const supabase = await createClient();
  const { error } = await supabase.from("os_fotos").insert({
    ordem_servico_id: dados.ordemServicoId,
    momento: dados.momento,
    url: dados.url,
    public_id: dados.publicId,
    largura: dados.largura,
    altura: dados.altura,
  });

  if (error) return { erro: "A foto subiu, mas não foi registrada na OS." };

  revalidatePath(`/os/${dados.ordemServicoId}`);
  revalidatePath(`/os/${dados.ordemServicoId}/fotos`);
  return { erro: null };
}

export async function apagarFoto(form: FormData) {
  const id = String(form.get("id") ?? "");
  const osId = String(form.get("os_id") ?? "");
  if (!id || !osId) return;

  const supabase = await createClient();
  const { data: foto } = await supabase
    .from("os_fotos")
    .select("public_id")
    .eq("id", id)
    .maybeSingle();

  await supabase.from("os_fotos").delete().eq("id", id);

  // Apaga também no Cloudinary: só remover a linha aqui deixaria o arquivo
  // ocupando espaço lá para sempre, e o plano gratuito tem teto.
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (foto?.public_id && cloudName && apiKey && apiSecret) {
    const timestamp = Math.floor(Date.now() / 1000);
    const assinatura = createHash("sha1")
      .update(`public_id=${foto.public_id}&timestamp=${timestamp}${apiSecret}`)
      .digest("hex");

    const corpo = new FormData();
    corpo.append("public_id", foto.public_id);
    corpo.append("timestamp", String(timestamp));
    corpo.append("api_key", apiKey);
    corpo.append("signature", assinatura);

    await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      { method: "POST", body: corpo },
    ).catch(() => {
      // A linha já saiu do banco; o arquivo órfão aparece na tela de
      // limpeza depois. Falhar aqui não pode travar o dono.
    });
  }

  revalidatePath(`/os/${osId}`);
  revalidatePath(`/os/${osId}/fotos`);
}
