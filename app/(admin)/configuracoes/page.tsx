import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { DadosLoja } from "@/lib/tipos";
import { FormularioLoja } from "./formulario";
import { sair } from "../../(auth)/login/actions";

const bloco = "rounded-xl border border-line bg-white p-4";

const EXPORTACOES = [
  {
    tipo: "ordens",
    rotulo: "Ordens de serviço",
    detalhe: "Tudo, com valores, serviços, datas e senha do aparelho.",
  },
  {
    tipo: "clientes",
    rotulo: "Clientes",
    detalhe: "Nome, contato, CPF e observações.",
  },
  {
    tipo: "caixa",
    rotulo: "Caixa",
    detalhe: "Toda entrada e saída, com forma de pagamento e OS ligada.",
  },
];

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("dados_loja")
    .select("*")
    .eq("singleton", true)
    .maybeSingle();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="font-display text-2xl font-bold text-navy">
        Configurações
      </h1>

      {[
        {
          href: "/servicos",
          titulo: "Serviços",
          detalhe: "O que você faz, com preço e garantia padrão de cada um.",
        },
        {
          href: "/mensagens",
          titulo: "Mensagens do WhatsApp",
          detalhe: "O texto que abre pronto ao avisar o cliente.",
        },
        {
          href: "/fotos",
          titulo: "Espaço de fotos",
          detalhe:
            "Quanto as fotos ocupam e quais já podem sair, por garantia vencida.",
        },
      ].map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex min-h-14 items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 hover:border-cyan-deep"
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium text-ink">{item.titulo}</p>
            <p className="text-xs text-mute">{item.detalhe}</p>
          </div>
          <span aria-hidden className="shrink-0 text-mute">
            →
          </span>
        </Link>
      ))}

      <section className={bloco}>
        <h2 className="mb-1 font-display text-lg font-semibold text-navy">
          Dados da loja
        </h2>
        <p className="mb-4 text-sm text-mute">
          Alimentam a landing, o PDF e as mensagens de WhatsApp ao mesmo tempo.
        </p>
        <FormularioLoja loja={(data ?? { nome: "E&S Tech" }) as DadosLoja} />
      </section>

      <section className={bloco}>
        <h2 className="mb-1 font-display text-lg font-semibold text-navy">
          Backup
        </h2>
        <p className="mb-4 text-sm text-mute">
          Baixe os três arquivos uma vez por semana. O plano gratuito do
          Supabase não faz backup diário — se a conta cair ou uma tabela for
          apagada, isto aqui é o que sobra.
        </p>

        <ul className="flex flex-col gap-2">
          {EXPORTACOES.map((e) => (
            <li key={e.tipo}>
              <a
                href={`/api/exportar/${e.tipo}`}
                download
                className="flex min-h-14 items-center gap-3 rounded-lg border border-line px-4 py-3 hover:border-cyan-deep"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{e.rotulo}</p>
                  <p className="text-xs text-mute">{e.detalhe}</p>
                </div>
                <span className="dado shrink-0 text-sm font-semibold text-cyan-deep">
                  CSV
                </span>
              </a>
            </li>
          ))}
        </ul>

        <p className="mt-4 rounded-lg border border-amber/40 bg-amber/10 p-3 text-sm text-ink">
          O arquivo de ordens contém <strong>senha de aparelho</strong> e{" "}
          <strong>custo de peça</strong>. É o preço de um backup que serve para
          alguma coisa — guarde o arquivo como você guardaria o caderno da loja.
        </p>
      </section>

      <form action={sair}>
        <button
          type="submit"
          className="h-12 w-full rounded-xl border border-line bg-white font-medium text-mute"
        >
          Sair
        </button>
      </form>
    </div>
  );
}
