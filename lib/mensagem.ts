import { codigo as formatarCodigo, moeda, soDigitos } from "@/lib/formato";
import type { StatusOS } from "@/lib/tipos";

export const SITUACOES = [
  "entrada",
  "orcamento",
  "pronto",
  "cobranca",
] as const;
export type Situacao = (typeof SITUACOES)[number];

export const ROTULO_SITUACAO: Record<Situacao, string> = {
  entrada: "Aparelho recebido",
  orcamento: "Orçamento enviado",
  pronto: "Pronto para retirar",
  cobranca: "Cobrança de saldo",
};

export const QUANDO_USAR: Record<Situacao, string> = {
  entrada: "Logo depois de abrir a OS, com o link de acompanhamento.",
  orcamento: "Quando o valor foi apurado e falta o cliente aprovar.",
  pronto: "Quando o serviço acabou e o aparelho pode ser retirado.",
  cobranca: "Quando ficou saldo em aberto depois da entrega.",
};

export type ModeloMensagem = {
  id: string;
  situacao: string;
  texto: string;
};

/** As variáveis disponíveis, com o que cada uma vira. */
export const VARIAVEIS = [
  { chave: "{cliente}", explica: "primeiro nome do cliente" },
  { chave: "{loja}", explica: "nome da sua loja" },
  { chave: "{codigo}", explica: "código da OS, como 4K7-92X" },
  { chave: "{aparelho}", explica: "marca e modelo" },
  { chave: "{valor}", explica: "valor total da OS" },
  { chave: "{saldo}", explica: "quanto ainda falta pagar" },
  { chave: "{link}", explica: "endereço de acompanhamento" },
] as const;

export type DadosMensagem = {
  cliente: string;
  loja: string;
  codigo: string;
  aparelho: string | null;
  valor: number;
  saldo: number;
  link: string;
};

/**
 * Só o primeiro nome: "Oi José Carlos da Silva" soa como cobrança de banco,
 * e a mensagem é de balcão.
 */
function primeiroNome(nome: string) {
  return nome.trim().split(/\s+/)[0] ?? nome;
}

export function preencher(texto: string, dados: DadosMensagem) {
  const mapa: Record<string, string> = {
    "{cliente}": primeiroNome(dados.cliente),
    "{loja}": dados.loja,
    "{codigo}": formatarCodigo(dados.codigo),
    "{aparelho}": dados.aparelho ?? "aparelho",
    "{valor}": moeda(dados.valor),
    "{saldo}": moeda(dados.saldo),
    "{link}": dados.link,
  };
  return texto.replace(
    /\{(cliente|loja|codigo|aparelho|valor|saldo|link)\}/g,
    (achado) => mapa[achado] ?? achado,
  );
}

/**
 * Monta o link do WhatsApp.
 *
 * O wa.me exige o número com código do país. Telefone de brasileiro é
 * anotado sem o 55, então ele entra aqui — sem isso o link abre uma conversa
 * vazia e parece que o sistema está quebrado.
 */
export function linkWhatsApp(telefone: string | null, mensagem: string) {
  const digitos = soDigitos(telefone ?? "");
  if (digitos.length < 10) return null;
  const comPais = digitos.length <= 11 ? `55${digitos}` : digitos;
  return `https://wa.me/${comPais}?text=${encodeURIComponent(mensagem)}`;
}

/** A situação que o estado da OS sugere — o dono pode trocar. */
export function situacaoSugerida(status: StatusOS, saldo: number): Situacao {
  if (status === "pronto") return "pronto";
  if (status === "orcamento_enviado") return "orcamento";
  if (status === "entregue" && saldo > 0) return "cobranca";
  return "entrada";
}
