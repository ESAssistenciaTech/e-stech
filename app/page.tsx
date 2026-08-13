import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { lojaPublica, servicosPublicos } from "@/lib/portal";
import { telefone as formatarTelefone, soDigitos } from "@/lib/formato";
import { LandingServicos } from "@/components/landing-servicos";

export const metadata = {
  title: "E&S Tech — Conserto de celular e computador",
  description:
    "Assistência técnica de celulares e computadores. Acompanhe seu conserto pelo site, com garantia por escrito.",
};

async function irParaOS(form: FormData) {
  "use server";
  const codigo = String(form.get("codigo") ?? "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
  redirect(codigo.length === 6 ? `/acompanhar/${codigo}` : "/acompanhar");
}

const PASSOS = [
  {
    titulo: "Você traz",
    texto:
      "A gente registra o aparelho, o estado em que chegou e o que você pediu. Sai com um comprovante e um código.",
  },
  {
    titulo: "Você acompanha",
    texto:
      "Pelo código, a qualquer hora, sem precisar ligar perguntando se já ficou pronto.",
  },
  {
    titulo: "Você busca",
    texto:
      "Avisamos no WhatsApp quando terminar. A garantia de cada serviço vem escrita no comprovante.",
  },
];

export default async function HomePage() {
  const [loja, categorias] = await Promise.all([
    lojaPublica(),
    servicosPublicos(),
  ]);

  const digitos = soDigitos(loja?.telefone ?? "");
  const whatsapp =
    digitos.length >= 10
      ? `https://wa.me/${digitos.length <= 11 ? `55${digitos}` : digitos}`
      : null;

  return (
    <div className="min-h-dvh bg-navy">
      <div className="mx-auto flex max-w-xl flex-col gap-10 px-5 pb-16 pt-8">
        <header className="flex items-center gap-2">
          <Image src="/logo-mark.svg" alt="" width={32} height={32} priority />
          <span className="font-display text-base font-bold text-white">
            {loja?.nome ?? "E&S Tech"}
          </span>
        </header>

        {/* O herói é a etiqueta de serviço, e ela é funcional: o campo de
            consulta É o diferencial, mostrado em uso em vez de descrito. */}
        <section>
          <h1 className="mb-6 font-display text-4xl font-bold leading-[1.05] tracking-tight text-white">
            Conserto de celular e computador com acompanhamento online.
          </h1>

          <form
            action={irParaOS}
            className="etiqueta relative rounded-2xl bg-paper px-5 pb-5 pt-8"
          >
            <span
              aria-hidden
              className="absolute left-1/2 top-3 size-4 -translate-x-1/2 rounded-full bg-navy"
            />
            <label
              htmlFor="codigo"
              className="mb-2 block text-xs font-semibold uppercase tracking-wide text-mute"
            >
              Já deixou seu aparelho aqui?
            </label>
            <div className="flex gap-2">
              <input
                id="codigo"
                name="codigo"
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                placeholder="4K7-92X"
                aria-label="Código da ordem de serviço"
                className="dado h-14 min-w-0 flex-1 rounded-lg border border-line bg-white px-3 text-center text-xl font-semibold uppercase tracking-widest text-navy outline-none focus:border-cyan-deep"
              />
              <button
                type="submit"
                className="h-14 shrink-0 rounded-lg bg-navy px-5 font-display font-semibold text-white"
              >
                Ver
              </button>
            </div>
          </form>
        </section>

        {categorias.size > 0 && (
          <LandingServicos
            categorias={[...categorias.entries()]}
            whatsapp={whatsapp}
          />
        )}

        {/* Numerado porque é sequência de verdade: a ordem é a informação. */}
        <section>
          <h2 className="mb-5 font-display text-xl font-bold text-white">
            Como funciona
          </h2>
          <ol className="flex flex-col gap-5">
            {PASSOS.map((p, i) => (
              <li key={p.titulo} className="flex gap-4">
                <span className="dado shrink-0 text-2xl font-bold leading-none text-cyan">
                  {i + 1}
                </span>
                <div>
                  <p className="font-display font-semibold text-white">
                    {p.titulo}
                  </p>
                  <p className="text-sm leading-relaxed text-white/70">
                    {p.texto}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {(loja?.endereco || loja?.horario || loja?.telefone) && (
          <section className="rounded-2xl border border-white/15 p-5">
            <h2 className="mb-3 font-display text-xl font-bold text-white">
              Onde nos achar
            </h2>
            {loja.endereco && (
              <p className="text-white/80">{loja.endereco}</p>
            )}
            {loja.horario && (
              <p className="text-white/60">{loja.horario}</p>
            )}
            {loja.telefone && (
              <p className="dado mt-1 text-white/80">
                {formatarTelefone(loja.telefone)}
              </p>
            )}
          </section>
        )}

        <footer className="flex items-center justify-between border-t border-white/10 pt-5">
          <Link href="/acompanhar" className="text-sm text-white/60">
            Acompanhar conserto
          </Link>
          <Link href="/login" className="text-sm text-white/40">
            Entrar
          </Link>
        </footer>
      </div>
    </div>
  );
}
