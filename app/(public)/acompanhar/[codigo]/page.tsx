import Link from "next/link";
import Image from "next/image";
import { consultarOS, lojaPublica, ETAPA } from "@/lib/portal";
import { codigo as formatarCodigo, dataHora } from "@/lib/formato";
import { STATUS } from "@/lib/tipos";

export const metadata = { title: "Acompanhar conserto — E&S Tech" };

function Marco({
  rotulo,
  quando,
  atual,
}: {
  rotulo: string;
  quando: string | null;
  atual: boolean;
}) {
  const aconteceu = quando !== null;
  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        <span
          aria-hidden
          className={`mt-1 size-3 shrink-0 rounded-full border-2 ${
            aconteceu
              ? "border-cyan-deep bg-cyan-deep"
              : "border-line bg-transparent"
          }`}
        />
        <span
          aria-hidden
          className={`w-0.5 flex-1 ${aconteceu ? "bg-cyan-deep/40" : "bg-line"}`}
        />
      </div>
      <div className="pb-5">
        <p
          className={`text-sm ${
            atual ? "font-semibold text-navy" : aconteceu ? "text-ink" : "text-mute"
          }`}
        >
          {rotulo}
        </p>
        {quando && (
          <p className="dado text-xs text-mute">{dataHora(quando)}</p>
        )}
      </div>
    </li>
  );
}

export default async function StatusPublicoPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const [os, loja] = await Promise.all([consultarOS(codigo), lojaPublica()]);

  if (!os) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-navy px-6 py-12 text-center">
        <Image src="/logo-mark.svg" alt="" width={56} height={56} />
        <div className="w-full max-w-sm rounded-xl bg-paper p-6">
          <h1 className="mb-2 font-display text-lg font-semibold text-navy">
            Código não encontrado
          </h1>
          <p className="mb-5 text-sm text-mute">
            Confira se digitou certo. O código tem 6 caracteres e está no seu
            comprovante.
          </p>
          <Link
            href="/acompanhar"
            className="inline-flex h-12 items-center rounded-lg bg-cyan-deep px-5 font-display font-semibold text-white"
          >
            Tentar de novo
          </Link>
        </div>
      </main>
    );
  }

  const etapa = ETAPA[os.status];
  const cor = STATUS[os.status].cor;
  const encerrada =
    os.status === "entregue" ||
    os.status === "recusado" ||
    os.status === "cancelado";

  return (
    <main className="flex min-h-dvh flex-col items-center bg-navy px-5 py-10">
      <div className="mb-8 flex items-center gap-2">
        <Image src="/logo-mark.svg" alt="" width={28} height={28} />
        <span className="font-display text-sm font-bold text-white">
          {loja?.nome ?? "E&S Tech"}
        </span>
      </div>

      {/* A etiqueta de serviço, em tamanho de objeto. O entalhe no topo é
          afordância real: é por ali que ela prende no aparelho. */}
      <article className="relative w-full max-w-sm rounded-2xl bg-paper pb-6 pt-9">
        <span
          aria-hidden
          className="absolute left-1/2 top-3 size-5 -translate-x-1/2 rounded-full bg-navy"
        />

        <div className="px-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-mute">
            Ordem de serviço
          </p>
          <p className="dado mt-1 text-4xl font-bold leading-none tracking-tight text-navy">
            {formatarCodigo(os.codigo_publico)}
          </p>

          {os.aparelho && (
            <p className="mt-3 text-lg font-medium text-ink">{os.aparelho}</p>
          )}
          {os.servicos.length > 0 && (
            <p className="text-sm text-mute">{os.servicos.join(" · ")}</p>
          )}
        </div>

        <div
          className="mt-5 px-6 py-3"
          style={{ backgroundColor: cor }}
        >
          <p className="font-display text-lg font-bold text-white">
            {etapa.titulo}
          </p>
          <p className="text-sm text-white/90">{etapa.texto}</p>
        </div>

        <ol className="mt-5 px-6">
          <Marco
            rotulo="Aparelho recebido"
            quando={os.data_entrada}
            atual={!os.data_conclusao && !os.data_entrega}
          />
          <Marco
            rotulo="Serviço concluído"
            quando={os.data_conclusao}
            atual={!!os.data_conclusao && !os.data_entrega}
          />
          <Marco
            rotulo="Retirado"
            quando={os.data_entrega}
            atual={!!os.data_entrega}
          />
        </ol>
      </article>

      {!encerrada && (loja?.telefone || loja?.horario) && (
        <div className="mt-6 w-full max-w-sm text-center">
          {loja?.horario && (
            <p className="text-sm text-white/70">{loja.horario}</p>
          )}
          {loja?.endereco && (
            <p className="text-sm text-white/70">{loja.endereco}</p>
          )}
        </div>
      )}

      <Link
        href="/acompanhar"
        className="mt-8 text-sm font-medium text-cyan"
      >
        Consultar outro código
      </Link>
    </main>
  );
}
