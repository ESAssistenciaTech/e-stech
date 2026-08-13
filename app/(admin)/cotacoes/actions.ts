"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { soDigitos } from "@/lib/formato";
import type { EstadoLoja } from "@/lib/tipos";

type PrecoEnviado = {
  fornecedor_id: string;
  qualidade_id: string;
  preco: number;
};

/**
 * Registra uma rodada de cotação inteira de uma vez.
 *
 * O dono pergunta a três fornecedores e cada um responde com duas ou três
 * qualidades — até nove preços numa consulta só. Se cada linha fosse um
 * formulário, o módulo morreria de desuso em duas semanas, como aconteceria
 * com a baixa de estoque (ADR 0006).
 */
export async function registrarCotacao(
  _anterior: EstadoLoja,
  form: FormData,
): Promise<EstadoLoja> {
  const supabase = await createClient();

  let pecaId = String(form.get("peca_id") ?? "").trim();
  const nomeNovo = String(form.get("peca_nome") ?? "").trim();
  const modelo = String(form.get("modelo_compativel") ?? "").trim();

  // Peça cadastrada na hora: exigir cadastro prévio faria parar a conversa
  // com o cliente para ir preencher outra tela.
  if (!pecaId) {
    if (!nomeNovo) return { erro: "Diga qual peça está sendo cotada.", ok: false };
    const { data, error } = await supabase
      .from("pecas")
      .insert({ nome: nomeNovo, modelo_compativel: modelo || null })
      .select("id")
      .single();
    if (error || !data) return { erro: "Não foi possível salvar a peça.", ok: false };
    pecaId = data.id;
  }

  let precos: PrecoEnviado[];
  try {
    precos = JSON.parse(String(form.get("precos") ?? "[]"));
  } catch {
    return { erro: "Não foi possível ler os preços.", ok: false };
  }

  const validos = precos.filter(
    (p) => p.fornecedor_id && p.qualidade_id && p.preco > 0,
  );
  if (validos.length === 0) {
    return { erro: "Preencha ao menos um preço.", ok: false };
  }

  // Sempre insere: cotação nova não sobrescreve a antiga (ADR 0010).
  const { error } = await supabase.from("cotacoes").insert(
    validos.map((p) => ({
      peca_id: pecaId,
      fornecedor_id: p.fornecedor_id,
      qualidade_id: p.qualidade_id,
      preco: p.preco,
    })),
  );

  if (error) return { erro: "Não foi possível salvar a cotação.", ok: false };

  revalidatePath("/cotacoes");
  redirect(`/cotacoes?peca=${pecaId}`);
}

export async function salvarFornecedor(
  _anterior: EstadoLoja,
  form: FormData,
): Promise<EstadoLoja> {
  const id = String(form.get("id") ?? "").trim();
  const nome = String(form.get("nome") ?? "").trim();
  if (!nome) return { erro: "O fornecedor precisa de um nome.", ok: false };

  const telefoneBruto = String(form.get("telefone") ?? "").trim();
  const dados = {
    nome,
    telefone: telefoneBruto ? soDigitos(telefoneBruto) : null,
    observacoes: String(form.get("observacoes") ?? "").trim() || null,
    ativo: form.get("ativo") !== null,
  };

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("fornecedores").update(dados).eq("id", id)
    : await supabase.from("fornecedores").insert(dados);

  if (error) return { erro: "Não foi possível salvar.", ok: false };

  revalidatePath("/fornecedores");
  revalidatePath("/cotacoes");
  redirect("/fornecedores");
}
