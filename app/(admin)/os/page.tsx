import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Etiqueta } from "@/components/etiqueta";
import { STATUS, STATUS_ABERTOS, type StatusOS } from "@/lib/tipos";

type Params = { searchParams: Promise<{ status?: string }> };

function descreverAparelho(os: {
  aparelho_marca: string | null;
  aparelho_modelo: string | null;
  marca_nao_identificada: boolean;
  modelo_nao_identificado: boolean;
}) {
  const partes = [
    os.marca_nao_identificada ? "marca não identificada" : os.aparelho_marca,
    os.modelo_nao_identificado ? "modelo não identificado" : os.aparelho_modelo,
  ].filter(Boolean);
  return partes.length > 0 ? partes.join(" ") : null;
}

export default async function ListaOSPage({ searchParams }: Params) {
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("ordens_servico")
    .select(
      "id, numero, codigo_publico, status, aparelho_marca, aparelho_modelo, marca_nao_identificada, modelo_nao_identificado, data_entrada, atualizado_em, clientes(nome)",
    )
    .order("data_entrada", { ascending: false })
    .limit(100);

  if (status && status !== "todos") {
    query = query.eq("status", status);
  } else if (!status) {
    // Sem filtro, mostra o que ainda ocupa a bancada — não o histórico inteiro.
    query = query.in("status", STATUS_ABERTOS);
  }

  const { data: ordens } = await query;

  const filtros: { valor: string; rotulo: string }[] = [
    { valor: "", rotulo: "Abertas" },
    ...STATUS_ABERTOS.map((s) => ({ valor: s, rotulo: STATUS[s].rotulo })),
    { valor: "entregue", rotulo: "Entregues" },
    { valor: "todos", rotulo: "Todas" },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-4 flex items-baseline gap-2">
        <h1 className="font-display text-3xl font-bold tracking-tight text-navy">
          Ordens
        </h1>
        {ordens && ordens.length > 0 && (
          <span className="dado text-lg font-medium text-mute">
            {ordens.length}
          </span>
        )}
      </header>

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {filtros.map((f) => {
          const ativo = (status ?? "") === f.valor;
          return (
            <Link
              key={f.valor || "abertas"}
              href={f.valor ? `/os?status=${f.valor}` : "/os"}
              className={`shrink-0 rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
                ativo
                  ? "border-navy bg-navy text-white"
                  : "border-line bg-white text-mute"
              }`}
            >
              {f.rotulo}
            </Link>
          );
        })}
      </div>

      {!ordens || ordens.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-white px-6 py-12 text-center">
          <p className="mb-1 font-display text-lg font-semibold text-navy">
            Bancada vazia
          </p>
          <p className="mb-5 text-sm text-mute">
            Nenhuma ordem neste filtro.
          </p>
          <Link
            href="/os/nova"
            className="inline-flex h-12 items-center rounded-lg bg-cyan-deep px-5 font-display font-semibold text-white"
          >
            Abrir uma OS
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {ordens.map((os) => {
            const cliente = os.clientes as unknown as { nome: string } | null;
            return (
              <li key={os.id}>
                <Etiqueta
                  id={os.id}
                  codigoPublico={os.codigo_publico}
                  status={os.status as StatusOS}
                  aparelho={descreverAparelho(os)}
                  cliente={cliente?.nome ?? "—"}
                  dataEntrada={os.data_entrada}
                  atualizadoEm={os.atualizado_em}
                />
              </li>
            );
          })}
        </ul>
      )}

      {/* Abrir OS é o verbo mais repetido da loja: fica fixo, logo acima da
          navegação, ao alcance do polegar em qualquer ponto da lista. */}
      <div className="nao-imprimir fixed inset-x-0 bottom-16 z-10 px-4 pb-3">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/os/nova"
            className="flex h-14 items-center justify-center gap-2 rounded-xl bg-cyan-deep font-display text-base font-semibold text-white shadow-lg shadow-navy/20"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              className="size-5"
              aria-hidden
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nova OS
          </Link>
        </div>
      </div>
      <div className="h-20" aria-hidden />
    </div>
  );
}
