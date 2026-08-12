import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Etiqueta } from "@/components/etiqueta";
import { STATUS, STATUS_ABERTOS, type StatusOS } from "@/lib/tipos";

type Params = { searchParams: Promise<{ status?: string }> };

function descreverAparelho(os: {
  aparelho_marca: string | null;
  aparelho_modelo: string | null;
}) {
  const partes = [os.aparelho_marca, os.aparelho_modelo].filter(Boolean);
  return partes.length > 0 ? partes.join(" ") : null;
}

export default async function ListaOSPage({ searchParams }: Params) {
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("ordens_servico")
    .select(
      "id, numero, codigo_publico, status, aparelho_marca, aparelho_modelo, data_entrada, data_conclusao, clientes(nome)",
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
      <div className="mb-4 flex items-center gap-3">
        <h1 className="font-display text-2xl font-bold text-navy">Ordens</h1>
        <Link
          href="/os/nova"
          className="ml-auto flex h-11 items-center rounded-lg bg-cyan-deep px-4 font-display text-sm font-semibold text-white hover:bg-navy"
        >
          Nova OS
        </Link>
      </div>

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {filtros.map((f) => {
          const ativo = (status ?? "") === f.valor;
          return (
            <Link
              key={f.valor || "abertas"}
              href={f.valor ? `/os?status=${f.valor}` : "/os"}
              className={`shrink-0 rounded-full border px-3 py-2 text-sm font-medium ${
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
        <div className="rounded-xl border border-dashed border-line bg-white p-8 text-center">
          <p className="mb-4 text-mute">Nenhuma OS aqui.</p>
          <Link
            href="/os/nova"
            className="inline-flex h-11 items-center rounded-lg bg-cyan-deep px-4 font-display text-sm font-semibold text-white"
          >
            Abrir a primeira
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
                  numero={os.numero}
                  codigoPublico={os.codigo_publico}
                  status={os.status as StatusOS}
                  aparelho={descreverAparelho(os)}
                  cliente={cliente?.nome ?? "—"}
                  dataEntrada={os.data_entrada}
                  dataConclusao={os.data_conclusao}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
