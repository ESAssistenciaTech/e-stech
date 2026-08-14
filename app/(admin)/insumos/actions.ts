"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { FORMAS_PAGAMENTO, type FormaPagamento } from "@/lib/caixa";
import type { EstadoCompra, EstadoInsumo, ItemComprado } from "@/lib/insumo";

function texto(form: FormData, campo: string) {
  const v = String(form.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

function inteiro(valor: FormDataEntryValue | null) {
  const n = Number(String(valor ?? "0").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

export async function salvarInsumo(
  _anterior: EstadoInsumo,
  form: FormData,
): Promise<EstadoInsumo> {
  const id = texto(form, "id");
  const nome = texto(form, "nome");

  if (!nome) return { erro: "Dê um nome ao insumo." };

  const quantidade = inteiro(form.get("quantidade"));
  if (quantidade === null) return { erro: "Quantidade inválida." };

  const dados = {
    nome,
    quantidade,
    observacoes: texto(form, "observacoes"),
    precisa_repor: form.get("precisa_repor") !== null,
    ativo: form.get("ativo") !== null,
  };

  const supabase = await createClient();

  if (id) {
    const { error } = await supabase.from("insumos").update(dados).eq("id", id);
    if (error) return { erro: "Não foi possível salvar." };
  } else {
    const { error } = await supabase.from("insumos").insert(dados);
    if (error) return { erro: "Não foi possível cadastrar." };
  }

  revalidatePath("/insumos");
  redirect("/insumos?ver=todos");
}

/**
 * Liga e desliga a marcação de reposição.
 *
 * É o gesto mais repetido do módulo, feito de pé na bancada com o frasco
 * vazio na mão — por isso é um toque só, direto da lista, sem abrir tela.
 */
export async function alternarReposicao(form: FormData) {
  const id = String(form.get("id") ?? "");
  const marcar = String(form.get("marcar") ?? "") === "true";
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("insumos").update({ precisa_repor: marcar }).eq("id", id);

  revalidatePath("/insumos");
}

export async function apagarInsumo(form: FormData) {
  const id = String(form.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("insumos").delete().eq("id", id);

  revalidatePath("/insumos");
  redirect("/insumos?ver=todos");
}

/**
 * Registra o reabastecimento.
 *
 * A conta e o lançamento no caixa acontecem dentro de `comprar_insumos`, numa
 * transação só. Fazer as duas coisas daqui, em duas chamadas, é exatamente o
 * jeito de um dia uma acontecer e a outra não.
 */
export async function registrarCompra(
  _anterior: EstadoCompra,
  form: FormData,
): Promise<EstadoCompra> {
  const forma = String(form.get("forma_pagamento") ?? "dinheiro");
  if (!FORMAS_PAGAMENTO.includes(forma as FormaPagamento)) {
    return { erro: "Forma de pagamento inválida." };
  }

  // Vírgula é como se digita dinheiro em português.
  const valor = Number(String(form.get("valor") ?? "0").replace(",", "."));
  if (!Number.isFinite(valor) || valor <= 0) {
    return { erro: "Informe quanto foi pago, maior que zero." };
  }

  const itens: ItemComprado[] = [];
  for (const [chave, bruto] of form.entries()) {
    if (!chave.startsWith("qtd_")) continue;
    const quantidade = inteiro(bruto);
    if (quantidade === null) return { erro: "Quantidade inválida." };
    if (quantidade > 0) itens.push({ id: chave.slice(4), quantidade });
  }

  if (itens.length === 0) {
    return { erro: "Diga quanto entrou de pelo menos um insumo." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("comprar_insumos", {
    itens,
    valor,
    forma,
    observacao: texto(form, "observacao"),
  });

  if (error) return { erro: "Não foi possível registrar a compra." };

  revalidatePath("/insumos");
  revalidatePath("/financeiro");
  revalidatePath("/dashboard");
  redirect("/insumos");
}
