import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { moeda } from "@/lib/formato";
import { STATUS, STATUS_ABERTOS, type StatusOS } from "@/lib/tipos";

export default async function DashboardPage() {
  const supabase = await createClient();

  const inicioDoMes = new Date();
  inicioDoMes.setDate(1);
  inicioDoMes.setHours(0, 0, 0, 0);

  const [{ data: abertas }, { data: entradas }] = await Promise.all([
    supabase
      .from("ordens_servico")
      .select("status")
      .in("status", STATUS_ABERTOS),
    supabase
      .from("movimentacoes_caixa")
      .select("valor")
      .eq("tipo", "entrada")
      .gte("data", inicioDoMes.toISOString()),
  ]);

  const porStatus = new Map<StatusOS, number>();
  for (const os of abertas ?? []) {
    const s = os.status as StatusOS;
    porStatus.set(s, (porStatus.get(s) ?? 0) + 1);
  }

  const faturamento = (entradas ?? []).reduce(
    (soma, m) => soma + Number(m.valor),
    0,
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="font-display text-2xl font-bold text-navy">Painel</h1>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-line bg-white p-4">
          <p className="text-sm text-mute">Na bancada</p>
          <p className="dado text-3xl font-bold text-navy">
            {abertas?.length ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-white p-4">
          <p className="text-sm text-mute">Recebido no mês</p>
          <p className="dado text-3xl font-bold text-navy">{moeda(faturamento)}</p>
        </div>
      </div>

      <section className="rounded-xl border border-line bg-white p-4">
        <h2 className="mb-3 font-display font-semibold text-navy">Por status</h2>
        {porStatus.size === 0 ? (
          <p className="text-sm text-mute">Nenhuma OS aberta.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {STATUS_ABERTOS.filter((s) => porStatus.has(s)).map((s) => (
              <li key={s}>
                <Link
                  href={`/os?status=${s}`}
                  className="flex min-h-11 items-center gap-3"
                >
                  <span
                    aria-hidden
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: STATUS[s].cor }}
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {STATUS[s].rotulo}
                  </span>
                  <span className="dado font-semibold">{porStatus.get(s)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link
        href="/os/nova"
        className="flex h-14 items-center justify-center rounded-xl bg-cyan-deep font-display text-base font-semibold text-white hover:bg-navy"
      >
        Nova OS
      </Link>
    </div>
  );
}
