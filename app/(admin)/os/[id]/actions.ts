"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { STATUS_OS, type StatusOS } from "@/lib/tipos";

export type EstadoStatus = { erro: string | null };

export async function mudarStatus(
  _anterior: EstadoStatus,
  form: FormData,
): Promise<EstadoStatus> {
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "") as StatusOS;
  const motivo = String(form.get("motivo_cancelamento") ?? "").trim();

  if (!id || !STATUS_OS.includes(status)) {
    return { erro: "Status inválido." };
  }

  // Cancelar sem dizer por quê deixa o relatório ilegível depois: não dá
  // pra distinguir "aparelho não tinha conserto" de "perdi o cliente".
  if (status === "cancelado" && !motivo) {
    return { erro: "Diga o motivo do cancelamento." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("ordens_servico")
    .update({
      status,
      motivo_cancelamento: status === "cancelado" ? motivo : null,
    })
    .eq("id", id);

  if (error) {
    return { erro: "Não foi possível mudar o status." };
  }

  // Estorno no cancelamento: quanto devolver é decisão humana caso a caso —
  // o sistema pergunta e registra o que foi decidido, sem impor regra.
  const estorno = Number(
    String(form.get("estorno") ?? "0").replace(",", "."),
  );
  if (status === "cancelado" && Number.isFinite(estorno) && estorno > 0) {
    const { error: erroEstorno } = await supabase
      .from("movimentacoes_caixa")
      .insert({
        tipo: "saida",
        categoria: "estorno",
        descricao: "Estorno por cancelamento",
        valor: estorno,
        ordem_servico_id: id,
      });

    if (erroEstorno) {
      // A OS já está cancelada; só o dinheiro não foi registrado.
      return {
        erro: "OS cancelada, mas o estorno não foi registrado. Lance no caixa.",
      };
    }
    revalidatePath("/financeiro");
  }

  // As datas de conclusão e entrega são gravadas por trigger no banco.
  revalidatePath(`/os/${id}`);
  revalidatePath("/os");
  return { erro: null };
}
