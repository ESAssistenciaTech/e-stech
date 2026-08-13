import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { codigo, moeda } from "@/lib/formato";
import { STATUS, STATUS_ABERTOS, type StatusOS } from "@/lib/tipos";

export default async function DashboardPage() {
  const supabase = await createClient();

  const inicioDoMes = new Date();
  inicioDoMes.setDate(1);
  inicioDoMes.setHours(0, 0, 0, 0);

  const [{ data: abertas }, { data: entradas }, { data: aReceber }] =
    await Promise.all([
      supabase
        .from("ordens_servico")
        .select("status")
        .in("status", STATUS_ABERTOS),
      supabase
        .from("movimentacoes_caixa")
        .select("valor")
        .eq("tipo", "entrada")
        .gte("data", inicioDoMes.toISOString()),
      // Entregue e ainda devendo. Fiado com cliente conhecido é rotina do
      // balcão — mas some de vista se não estiver na tela que se olha todo dia.
      supabase
        .from("ordens_servico_totais")
        .select("id, numero, codigo_publico, saldo")
        .eq("status", "entregue")
        .gt("saldo", 0)
        .order("saldo", { ascending: false }),
    ]);

  const porStatus = new Map<StatusOS, number>();
  for (const os of abertas ?? []) {
    const s = os.status as StatusOS;
    porStatus.set(s, (porStatus.get(s) ?? 0) + 1);
  }

  const naBancada = abertas?.length ?? 0;
  const prontas = porStatus.get("pronto") ?? 0;
  const faturamento = (entradas ?? []).reduce(
    (soma, m) => soma + Number(m.valor),
    0,
  );
  const totalAReceber = (aReceber ?? []).reduce(
    (soma, os) => soma + Number(os.saldo),
    0,
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      {/* O número que decide o dia: quantos aparelhos estão sob sua guarda. */}
      <section>
        <p className="text-sm font-medium text-mute">Na bancada</p>
        <p className="dado text-6xl font-bold leading-none tracking-tight text-navy">
          {naBancada}
        </p>
        {prontas > 0 && (
          <Link
            href="/os?status=pronto"
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-status-pronto"
          >
            <span className="size-2 rounded-full bg-status-pronto" aria-hidden />
            {prontas === 1
              ? "1 pronta esperando retirada"
              : `${prontas} prontas esperando retirada`}
          </Link>
        )}
      </section>

      {porStatus.size > 0 && (
        <section className="rounded-xl border border-line bg-white">
          {STATUS_ABERTOS.filter((s) => porStatus.has(s)).map((s, i) => (
            <Link
              key={s}
              href={`/os?status=${s}`}
              className={`flex min-h-12 items-center gap-3 px-4 ${
                i > 0 ? "border-t border-line" : ""
              }`}
            >
              <span
                aria-hidden
                className="h-6 w-1 rounded-full"
                style={{ backgroundColor: STATUS[s].cor }}
              />
              <span className="min-w-0 flex-1 truncate text-sm">
                {STATUS[s].rotulo}
              </span>
              <span className="dado font-semibold text-navy">
                {porStatus.get(s)}
              </span>
            </Link>
          ))}
        </section>
      )}

      {aReceber && aReceber.length > 0 && (
        <section className="rounded-xl border border-amber/40 bg-amber/10 p-4">
          <div className="mb-3 flex items-baseline gap-2">
            <h2 className="font-display font-semibold text-navy">A receber</h2>
            <span className="dado ml-auto text-xl font-bold text-navy">
              {moeda(totalAReceber)}
            </span>
          </div>
          <ul className="flex flex-col gap-1">
            {aReceber.map((os) => (
              <li key={os.id}>
                <Link
                  href={`/os/${os.id}`}
                  className="flex min-h-11 items-center gap-3"
                >
                  <span className="dado min-w-0 flex-1 truncate font-medium text-navy">
                    {codigo(os.codigo_publico)}
                  </span>
                  <span className="dado font-semibold">{moeda(os.saldo)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-line bg-white p-4">
        <p className="text-sm font-medium text-mute">Recebido no mês</p>
        <p className="dado text-3xl font-bold tracking-tight text-navy">
          {moeda(faturamento)}
        </p>
      </section>

      <Link
        href="/os/nova"
        className="flex h-14 items-center justify-center gap-2 rounded-xl bg-cyan-deep font-display text-base font-semibold text-white"
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
  );
}
