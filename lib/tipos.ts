/** Tipos do domínio. Os nomes seguem o CONTEXT.md — não inventar sinônimo. */

export const STATUS_OS = [
  "aguardando_analise",
  "em_analise",
  "orcamento_enviado",
  "aprovado",
  "em_conserto",
  "pronto",
  "entregue",
  "recusado",
  "cancelado",
] as const;

export type StatusOS = (typeof STATUS_OS)[number];

/** Rótulo e cor de cada status. Cor sozinha nunca comunica — sempre com texto. */
export const STATUS: Record<StatusOS, { rotulo: string; cor: string }> = {
  aguardando_analise: { rotulo: "Aguardando análise", cor: "var(--color-status-aguardando)" },
  em_analise: { rotulo: "Em análise", cor: "var(--color-status-aguardando)" },
  orcamento_enviado: { rotulo: "Orçamento enviado", cor: "var(--color-status-orcamento)" },
  aprovado: { rotulo: "Aprovado", cor: "var(--color-status-aprovado)" },
  em_conserto: { rotulo: "Em conserto", cor: "var(--color-status-conserto)" },
  pronto: { rotulo: "Pronto", cor: "var(--color-status-pronto)" },
  entregue: { rotulo: "Entregue", cor: "var(--color-status-entregue)" },
  recusado: { rotulo: "Recusado", cor: "var(--color-status-recusado)" },
  cancelado: { rotulo: "Cancelado", cor: "var(--color-status-recusado)" },
};

/** Status em que a OS ainda ocupa espaço na bancada. */
export const STATUS_ABERTOS: StatusOS[] = [
  "aguardando_analise",
  "em_analise",
  "orcamento_enviado",
  "aprovado",
  "em_conserto",
  "pronto",
];

export const TIPOS_APARELHO = [
  "celular",
  "notebook",
  "desktop",
  "tablet",
  "outro",
] as const;

export type TipoAparelho = (typeof TIPOS_APARELHO)[number];

/** Rótulo do campo de identificação muda conforme o aparelho. */
export const ROTULO_IDENTIFICADOR: Record<TipoAparelho, string> = {
  celular: "IMEI",
  notebook: "Número de série",
  desktop: "Número de série",
  tablet: "IMEI ou número de série",
  outro: "Identificação",
};

export type Marca = {
  id: string;
  nome: string;
  tipos: TipoAparelho[];
  ativa: boolean;
};

/**
 * Como o aparelho é desbloqueado.
 *
 * Guardar só o valor perderia o gesto: "1236" pode ser PIN digitado ou
 * desenho ligando pontos, e são coisas diferentes na hora de abrir.
 */
export const TIPOS_SENHA = ["pin", "padrao", "senha", "sem_senha"] as const;
export type TipoSenha = (typeof TIPOS_SENHA)[number];

export const ROTULO_SENHA: Record<TipoSenha, string> = {
  pin: "PIN",
  padrao: "Padrão",
  senha: "Senha",
  sem_senha: "Sem senha",
};

export const DICA_SENHA: Record<TipoSenha, string> = {
  pin: "Só números, como 4 ou 6 dígitos",
  padrao: "Toque os pontos na ordem do desenho",
  senha: "Letras, números e símbolos",
  sem_senha: "O aparelho abre sem desbloqueio",
};

export type Cliente = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  cpf: string | null;
  observacoes: string | null;
  criado_em: string;
};

export type TipoServico = {
  id: string;
  nome: string;
  categoria: string;
  garantia_dias_padrao: number;
  valor_padrao: number;
  ativo: boolean;
};

export type OrdemServico = {
  id: string;
  numero: number;
  codigo_publico: string;
  cliente_id: string;
  aparelho_tipo: TipoAparelho | null;
  aparelho_marca: string | null;
  aparelho_modelo: string | null;
  aparelho_identificador: string | null;
  /** Sensível: só na área privada. Nunca em portal, comprovante ou log. */
  senha_aparelho: string | null;
  senha_tipo: TipoSenha | null;
  /**
   * Distinguem "não preenchi" de "não deu para verificar" — celular que não
   * liga não tem IMEI conferível, e às vezes nem o dono sabe o modelo.
   */
  marca_nao_identificada: boolean;
  modelo_nao_identificado: boolean;
  identificador_nao_identificado: boolean;
  solicitacao: string;
  diagnostico: string | null;
  servico_realizado: string | null;
  status: StatusOS;
  valor_peca: number;
  /** Interno: sem ele o sistema mostra faturamento, não lucro. */
  custo_peca: number;
  motivo_cancelamento: string | null;
  os_origem_id: string | null;
  data_entrada: string;
  data_conclusao: string | null;
  data_entrega: string | null;
};

export type ServicoDaOS = {
  id: string;
  ordem_servico_id: string;
  tipo_servico_id: string;
  valor: number;
  garantia_dias: number;
};

/**
 * Estado das ações de cliente.
 *
 * Mora aqui e não no arquivo de action porque um módulo "use server" só
 * pode exportar função async — exportar um objeto dele quebra o build.
 */
export type EstadoCliente = { erro: string | null };
export const CLIENTE_INICIAL: EstadoCliente = { erro: null };

export type EstadoServico = { erro: string | null };
export const SERVICO_INICIAL: EstadoServico = { erro: null };

export type EstadoOS = { erro: string | null };
export const OS_INICIAL: EstadoOS = { erro: null };

export type EstadoOSEdicao = { erro: string | null };
export const OS_EDICAO_INICIAL: EstadoOSEdicao = { erro: null };

export type EstadoLoja = { erro: string | null; ok: boolean };
export const LOJA_INICIAL: EstadoLoja = { erro: null, ok: false };

export type DadosLoja = {
  nome: string;
  endereco: string | null;
  horario: string | null;
  telefone: string | null;
  logo_url: string | null;
  margem_padrao: number;
};

/** Vem da view ordens_servico_totais. Nada disso é armazenado. */
export type TotaisOS = {
  id: string;
  valor_mao_obra: number;
  valor_total: number;
  valor_pago: number;
  saldo: number;
  lucro: number;
  /** Interno, como na tabela: nunca em comprovante, portal ou log. */
  custo_peca: number;
  data_entrega: string | null;
};
