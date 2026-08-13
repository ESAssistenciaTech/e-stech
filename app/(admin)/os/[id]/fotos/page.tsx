import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { codigo, dataHora } from "@/lib/formato";
import { versao } from "@/lib/imagem";
import { EnviarFotos } from "./enviar";
import { apagarFoto } from "./actions";

type Foto = {
  id: string;
  momento: "entrada" | "entrega";
  url: string;
  criado_em: string;
};

const MOMENTOS = [
  {
    chave: "entrada" as const,
    titulo: "Na entrada",
    porque:
      "Como o aparelho chegou. É o que responde quando alguém diz que já estava riscado.",
  },
  {
    chave: "entrega" as const,
    titulo: "Na entrega",
    porque:
      "Como o aparelho saiu. É o que responde depois que ele já não está mais com você.",
  },
];

export default async function FotosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: os }, { data: fotos }] = await Promise.all([
    supabase
      .from("ordens_servico")
      .select("id, codigo_publico")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("os_fotos")
      .select("id, momento, url, criado_em")
      .eq("ordem_servico_id", id)
      .order("criado_em"),
  ]);

  if (!os) notFound();

  const porMomento = new Map<string, Foto[]>();
  for (const f of (fotos ?? []) as Foto[]) {
    const lista = porMomento.get(f.momento) ?? [];
    lista.push(f);
    porMomento.set(f.momento, lista);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link href={`/os/${id}`} className="text-sm font-medium text-cyan-deep">
        ← {codigo(os.codigo_publico)}
      </Link>

      <div>
        <h1 className="font-display text-2xl font-bold text-navy">
          Estado do aparelho
        </h1>
        <p className="text-sm text-mute">
          As fotos ficam só nesta área. Não aparecem no portal nem no
          comprovante do cliente.
        </p>
      </div>

      {MOMENTOS.map((m) => {
        const lista = porMomento.get(m.chave) ?? [];
        return (
          <section
            key={m.chave}
            className="rounded-xl border border-line bg-white p-4"
          >
            <h2 className="font-display text-lg font-semibold text-navy">
              {m.titulo}
            </h2>
            <p className="mb-3 text-sm text-mute">{m.porque}</p>

            {lista.length > 0 && (
              <ul className="mb-3 grid grid-cols-3 gap-2">
                {lista.map((f) => (
                  <li key={f.id} className="group relative">
                    <a
                      href={versao(f.url, 1280)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {/* Cloudinary já é CDN e faz o corte: passar por outro
                          otimizador refaria trabalho pronto. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={versao(f.url, 400)}
                        alt={`Aparelho ${m.titulo.toLowerCase()}, ${dataHora(f.criado_em)}`}
                        loading="lazy"
                        className="aspect-square w-full rounded-lg border border-line object-cover"
                      />
                    </a>
                    <form action={apagarFoto}>
                      <input type="hidden" name="id" value={f.id} />
                      <input type="hidden" name="os_id" value={id} />
                      <button
                        type="submit"
                        aria-label="Apagar foto"
                        className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-full bg-navy/70 text-sm text-white"
                      >
                        ×
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}

            <EnviarFotos ordemServicoId={id} momento={m.chave} />
          </section>
        );
      })}
    </div>
  );
}
