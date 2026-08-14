import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { codigo, data as formatarData, diasDesde } from "@/lib/formato";
import { tamanhoLegivel } from "@/lib/imagem";
import { cloudinaryConfigurado, listarImagens } from "@/lib/cloudinary";
import { apagarFotosDasOrdens, apagarOrfas } from "./actions";

type LinhaLimpeza = {
  id: string;
  numero: number;
  codigo_publico: string;
  data_entrega: string;
  garantia_dias: number;
  garantia_ate: string;
  fotos: number;
  bytes: number;
};

/**
 * Espaço ocupado pelas fotos, e o que já pode sair.
 *
 * Manual por decisão: apagar prova de estado no dia em que a garantia vence
 * é o tipo de automatismo que um dia apaga justo a foto de que se precisava.
 * A tela mostra e ordena; quem aperta é o dono.
 */
export default async function FotosPage() {
  const supabase = await createClient();

  const [{ data: todas }, { data: limpeza }] = await Promise.all([
    supabase.from("os_fotos").select("bytes"),
    supabase
      .from("os_fotos_limpeza")
      .select("*")
      .lt("garantia_ate", new Date().toISOString())
      .order("bytes", { ascending: false }),
  ]);

  const linhas = (limpeza ?? []) as unknown as LinhaLimpeza[];

  const totalFotos = todas?.length ?? 0;
  const totalBytes = (todas ?? []).reduce(
    (soma, f) => soma + Number(f.bytes ?? 200_000),
    0,
  );

  const vencidasBytes = linhas.reduce((soma, l) => soma + Number(l.bytes), 0);
  const vencidasFotos = linhas.reduce((soma, l) => soma + l.fotos, 0);

  // Arquivo que ficou na nuvem sem linha no banco — sobra de falha de rede
  // no meio de um apagamento. Ocupa cota e não aparece em tela nenhuma.
  const naNuvem = cloudinaryConfigurado() ? await listarImagens() : null;
  let orfas = 0;
  let orfasBytes = 0;

  if (naNuvem) {
    const { data: registradas } = await supabase
      .from("os_fotos")
      .select("public_id");
    const conhecidas = new Set((registradas ?? []).map((f) => f.public_id));

    for (const i of naNuvem) {
      if (conhecidas.has(i.publicId)) continue;
      orfas += 1;
      orfasBytes += i.bytes;
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link href="/configuracoes" className="text-sm font-medium text-cyan-deep">
        ← Configurações
      </Link>

      <div>
        <h1 className="font-display text-2xl font-bold text-navy">
          Espaço de fotos
        </h1>
        <p className="text-sm text-mute">
          O único dado do sistema que cresce sozinho. O plano gratuito do
          Cloudinary tem teto, e quem decide o que sai é você — nada aqui
          apaga nada por conta própria.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-line bg-white p-3">
          <p className="text-xs text-mute">Guardado</p>
          <p className="dado text-lg font-bold text-navy">
            {tamanhoLegivel(totalBytes)}
          </p>
          <p className="dado text-xs text-mute">
            {totalFotos} {totalFotos === 1 ? "foto" : "fotos"}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-white p-3">
          <p className="text-xs text-mute">Já pode sair</p>
          <p className="dado text-lg font-bold text-navy">
            {tamanhoLegivel(vencidasBytes)}
          </p>
          <p className="dado text-xs text-mute">
            {vencidasFotos} em {linhas.length}{" "}
            {linhas.length === 1 ? "ordem" : "ordens"}
          </p>
        </div>
      </div>

      <section>
        <h2 className="mb-1 font-display text-lg font-semibold text-navy">
          Garantia vencida
        </h2>
        <p className="mb-3 text-sm text-mute">
          Ordenadas pelo que ocupam. Enquanto a garantia corre, a foto é o que
          responde &quot;saiu assim daqui&quot; — por isso só aparece aqui
          depois que ela vence.
        </p>

        {linhas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-white px-6 py-10 text-center">
            <p className="font-display text-lg font-semibold text-navy">
              Nada para limpar
            </p>
            <p className="text-sm text-mute">
              Nenhuma ordem com garantia vencida guardando foto.
            </p>
          </div>
        ) : (
          <form action={apagarFotosDasOrdens} className="flex flex-col gap-3">
            <ul className="rounded-xl border border-line bg-white">
              {linhas.map((l, i) => {
                const venceuHa = diasDesde(l.garantia_ate) ?? 0;
                return (
                  <li
                    key={l.id}
                    className={i > 0 ? "border-t border-line" : undefined}
                  >
                    <label className="flex min-h-14 cursor-pointer items-center gap-3 px-4 py-2">
                      <input
                        type="checkbox"
                        name="os"
                        value={l.id}
                        className="size-5 shrink-0 accent-cyan-deep"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="dado block truncate font-medium text-navy">
                          {codigo(l.codigo_publico)}
                        </span>
                        <span className="dado block truncate text-xs text-mute">
                          entregue {formatarData(l.data_entrega)} · garantia
                          venceu há {venceuHa}{" "}
                          {venceuHa === 1 ? "dia" : "dias"}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="dado block text-sm font-semibold text-ink">
                          {tamanhoLegivel(Number(l.bytes))}
                        </span>
                        <span className="dado block text-xs text-mute">
                          {l.fotos} {l.fotos === 1 ? "foto" : "fotos"}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>

            <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-line bg-white px-3">
              <input
                type="checkbox"
                required
                className="size-5 accent-cyan-deep"
              />
              <span className="text-sm text-ink">
                Entendo que a foto some para sempre, aqui e no Cloudinary.
              </span>
            </label>

            <button
              type="submit"
              className="h-12 rounded-lg border border-status-recusado/40 bg-white font-display font-semibold text-status-recusado"
            >
              Apagar as fotos das ordens marcadas
            </button>
          </form>
        )}
      </section>

      {naNuvem === null ? (
        <p className="rounded-xl border border-line bg-white p-4 text-sm text-mute">
          Sem as variáveis do Cloudinary no ambiente não dá para conferir
          arquivo solto na nuvem. O resto da tela funciona.
        </p>
      ) : (
        orfas > 0 && (
          <section className="rounded-xl border border-line bg-white p-4">
            <h2 className="mb-1 font-display text-lg font-semibold text-navy">
              Arquivos soltos
            </h2>
            <p className="mb-3 text-sm text-mute">
              {orfas} {orfas === 1 ? "arquivo está" : "arquivos estão"} no
              Cloudinary sem linha no banco, ocupando{" "}
              <span className="dado">{tamanhoLegivel(orfasBytes)}</span>. É
              sobra de apagamento que falhou no meio: nenhuma tela mostra
              {orfas === 1 ? " esse arquivo" : " esses arquivos"}, e ninguém
              vai sentir falta.
            </p>
            <form action={apagarOrfas}>
              <button
                type="submit"
                className="h-11 w-full rounded-lg border border-line font-medium text-mute"
              >
                Apagar os arquivos soltos
              </button>
            </form>
          </section>
        )
      )}
    </div>
  );
}
