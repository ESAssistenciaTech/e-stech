"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  CATEGORIAS_ENTRADA,
  CATEGORIAS_SAIDA,
  FORMAS_PAGAMENTO,
  type EstadoCaixa,
  type FormaPagamento,
} from "@/lib/caixa";

/**
 * Registra uma movimentação de caixa — o único registro de dinheiro do
 * sistema (ADR 0002). Sinal, parcial, quitação e estorno são todos linhas
 * daqui: não existe tabela de pagamentos nem coluna "pago" na OS.
 */
export async function registrarMovimentacao(
  _anterior: EstadoCaixa,
  form: FormData,
): Promise<EstadoCaixa> {
  const tipo = String(form.get("tipo") ?? "");
  const categoria = String(form.get("categoria") ?? "");
  const formaPagamento = String(form.get("forma_pagamento") ?? "dinheiro");
  const descricao = String(form.get("descricao") ?? "").trim();
  const ordemServicoId = String(form.get("ordem_servico_id") ?? "").trim();

  // Vírgula é como se digita dinheiro em português.
  const valor = Number(String(form.get("valor") ?? "0").replace(",", "."));

  if (tipo !== "entrada" && tipo !== "saida") {
    return { erro: "Escolha entrada ou saída.", ok: false };
  }

  const permitidas: readonly string[] =
    tipo === "entrada" ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA;
  if (!permitidas.includes(categoria)) {
    return { erro: "Categoria inválida para esse tipo.", ok: false };
  }

  if (!FORMAS_PAGAMENTO.includes(formaPagamento as FormaPagamento)) {
    return { erro: "Forma de pagamento inválida.", ok: false };
  }

  if (!Number.isFinite(valor) || valor <= 0) {
    return { erro: "Informe um valor maior que zero.", ok: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("movimentacoes_caixa").insert({
    tipo,
    categoria,
    descricao: descricao || null,
    valor,
    forma_pagamento: formaPagamento,
    ordem_servico_id: ordemServicoId || null,
  });

  if (error) {
    return { erro: "Não foi possível registrar.", ok: false };
  }

  revalidatePath("/financeiro");
  revalidatePath("/dashboard");
  if (ordemServicoId) revalidatePath(`/os/${ordemServicoId}`);

  return { erro: null, ok: true };
}
