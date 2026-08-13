import { createClient } from "@/lib/supabase/server";
import type { StatusOS } from "@/lib/tipos";

export type OSPublica = {
  codigo_publico: string;
  status: StatusOS;
  aparelho: string | null;
  servicos: string[];
  data_entrada: string;
  data_conclusao: string | null;
  data_entrega: string | null;
};

/**
 * Única porta de entrada anônima do sistema.
 *
 * Passa por uma função no banco que monta o objeto campo a campo — a tabela
 * ordens_servico não é legível por anônimo. Nenhum código do portal deve
 * consultar a tabela direto, nem hoje nem depois.
 */
export async function consultarOS(codigo: string): Promise<OSPublica | null> {
  const limpo = codigo.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (limpo.length !== 6) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("consultar_os", {
    codigo: limpo,
  });

  if (error || !data || data.length === 0) return null;
  return data[0] as OSPublica;
}

/**
 * O que o cliente lê em cada etapa.
 *
 * Escrito da cadeira dele, não da bancada: "em análise" é jargão de loja;
 * "estamos vendo o que houve" é o que responde a dúvida de quem deixou o
 * aparelho e quer saber se pode contar com ele na sexta.
 */
export const ETAPA: Record<StatusOS, { titulo: string; texto: string }> = {
  aguardando_analise: {
    titulo: "Na fila",
    texto: "Recebemos seu aparelho. Ele entra em análise em breve.",
  },
  em_analise: {
    titulo: "Em análise",
    texto: "Estamos verificando o que houve para poder passar o orçamento.",
  },
  orcamento_enviado: {
    titulo: "Orçamento enviado",
    texto: "Passamos o valor e estamos aguardando sua resposta.",
  },
  aprovado: {
    titulo: "Aprovado",
    texto: "Orçamento aceito. O conserto entra na fila da bancada.",
  },
  em_conserto: {
    titulo: "Em conserto",
    texto: "Seu aparelho está na bancada agora.",
  },
  pronto: {
    titulo: "Pronto",
    texto: "O serviço acabou. Pode vir buscar.",
  },
  entregue: {
    titulo: "Entregue",
    texto: "Aparelho retirado. Qualquer coisa dentro da garantia, é só voltar.",
  },
  recusado: {
    titulo: "Orçamento recusado",
    texto: "O orçamento não foi aprovado. O aparelho está disponível para retirada.",
  },
  cancelado: {
    titulo: "Cancelada",
    texto: "Esta ordem foi encerrada. Fale com a loja para saber os detalhes.",
  },
};
