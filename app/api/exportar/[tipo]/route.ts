import { createClient } from "@/lib/supabase/server";
import { paraCSV, respostaCSV } from "@/lib/csv";
import { STATUS, type StatusOS } from "@/lib/tipos";
import { ROTULO_CATEGORIA, ROTULO_FORMA } from "@/lib/caixa";

const TIPOS = ["ordens", "clientes", "caixa"] as const;
type Tipo = (typeof TIPOS)[number];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tipo: string }> },
) {
  const { tipo } = await params;

  if (!TIPOS.includes(tipo as Tipo)) {
    return new Response("Tipo de exportação desconhecido.", { status: 404 });
  }

  const supabase = await createClient();

  // O proxy já barra quem não tem sessão, mas rota de API não pode depender
  // só disso: é ela que entrega o arquivo com senha de aparelho e custo.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Não autorizado.", { status: 401 });

  if (tipo === "clientes") {
    const { data } = await supabase
      .from("clientes")
      .select("nome, telefone, email, cpf, observacoes, criado_em")
      .order("nome");

    return respostaCSV(
      "clientes",
      paraCSV(
        [
          { chave: "nome", rotulo: "Nome" },
          { chave: "telefone", rotulo: "Telefone" },
          { chave: "email", rotulo: "Email" },
          { chave: "cpf", rotulo: "CPF" },
          { chave: "observacoes", rotulo: "Observações" },
          { chave: "criado_em", rotulo: "Cadastrado em" },
        ],
        data ?? [],
      ),
    );
  }

  if (tipo === "caixa") {
    const { data } = await supabase
      .from("movimentacoes_caixa")
      .select("*, ordens_servico(codigo_publico)")
      .order("data", { ascending: false });

    const linhas = (data ?? []).map((m) => ({
      data: m.data,
      tipo: m.tipo === "entrada" ? "Entrada" : "Saída",
      categoria: ROTULO_CATEGORIA[m.categoria] ?? m.categoria,
      descricao: m.descricao,
      valor: m.valor,
      forma: ROTULO_FORMA[m.forma_pagamento as keyof typeof ROTULO_FORMA],
      os: (m.ordens_servico as { codigo_publico: string } | null)
        ?.codigo_publico,
    }));

    return respostaCSV(
      "caixa",
      paraCSV(
        [
          { chave: "data", rotulo: "Data" },
          { chave: "tipo", rotulo: "Tipo" },
          { chave: "categoria", rotulo: "Categoria" },
          { chave: "descricao", rotulo: "Descrição" },
          { chave: "valor", rotulo: "Valor" },
          { chave: "forma", rotulo: "Forma" },
          { chave: "os", rotulo: "OS" },
        ],
        linhas,
      ),
    );
  }

  // ordens ------------------------------------------------------------------
  const [{ data: ordens }, { data: totais }, { data: servicos }] =
    await Promise.all([
      supabase
        .from("ordens_servico")
        .select("*, clientes(nome, telefone)")
        .order("numero"),
      supabase.from("ordens_servico_totais").select("*"),
      supabase
        .from("os_servicos")
        .select("ordem_servico_id, valor, garantia_dias, tipos_servico(nome)"),
    ]);

  const porOS = new Map(
    (totais ?? []).map((t) => [t.id as string, t] as const),
  );

  const servicosPorOS = new Map<string, string[]>();
  for (const s of servicos ?? []) {
    const nome =
      (s.tipos_servico as unknown as { nome: string } | null)?.nome ?? "?";
    const lista = servicosPorOS.get(s.ordem_servico_id) ?? [];
    lista.push(`${nome} (${s.valor}, ${s.garantia_dias}d)`);
    servicosPorOS.set(s.ordem_servico_id, lista);
  }

  const linhas = (ordens ?? []).map((os) => {
    const t = porOS.get(os.id);
    const cliente = os.clientes as unknown as {
      nome: string;
      telefone: string | null;
    } | null;
    return {
      numero: os.numero,
      codigo: os.codigo_publico,
      status: STATUS[os.status as StatusOS]?.rotulo ?? os.status,
      cliente: cliente?.nome,
      telefone: cliente?.telefone,
      aparelho: [os.aparelho_marca, os.aparelho_modelo]
        .filter(Boolean)
        .join(" "),
      identificador: os.aparelho_identificador,
      senha: os.senha_aparelho,
      solicitacao: os.solicitacao,
      diagnostico: os.diagnostico,
      servico_realizado: os.servico_realizado,
      servicos: (servicosPorOS.get(os.id) ?? []).join(" | "),
      mao_obra: t?.valor_mao_obra,
      valor_peca: os.valor_peca,
      custo_peca: os.custo_peca,
      total: t?.valor_total,
      pago: t?.valor_pago,
      saldo: t?.saldo,
      lucro: t?.lucro,
      motivo_cancelamento: os.motivo_cancelamento,
      data_entrada: os.data_entrada,
      data_conclusao: os.data_conclusao,
      data_entrega: os.data_entrega,
    };
  });

  return respostaCSV(
    "ordens-de-servico",
    paraCSV(
      [
        { chave: "numero", rotulo: "Número" },
        { chave: "codigo", rotulo: "Código" },
        { chave: "status", rotulo: "Status" },
        { chave: "cliente", rotulo: "Cliente" },
        { chave: "telefone", rotulo: "Telefone" },
        { chave: "aparelho", rotulo: "Aparelho" },
        { chave: "identificador", rotulo: "IMEI/Série" },
        { chave: "senha", rotulo: "Senha do aparelho" },
        { chave: "solicitacao", rotulo: "Solicitação" },
        { chave: "diagnostico", rotulo: "Diagnóstico" },
        { chave: "servico_realizado", rotulo: "Serviço realizado" },
        { chave: "servicos", rotulo: "Serviços" },
        { chave: "mao_obra", rotulo: "Mão de obra" },
        { chave: "valor_peca", rotulo: "Valor da peça" },
        { chave: "custo_peca", rotulo: "Custo da peça" },
        { chave: "total", rotulo: "Total" },
        { chave: "pago", rotulo: "Pago" },
        { chave: "saldo", rotulo: "Saldo" },
        { chave: "lucro", rotulo: "Lucro" },
        { chave: "motivo_cancelamento", rotulo: "Motivo do cancelamento" },
        { chave: "data_entrada", rotulo: "Entrada" },
        { chave: "data_conclusao", rotulo: "Conclusão" },
        { chave: "data_entrega", rotulo: "Entrega" },
      ],
      linhas,
    ),
  );
}
