/**
 * Conversa com o Cloudinary pela Admin API.
 *
 * Só roda no servidor: usa `CLOUDINARY_API_SECRET`, que nunca pode chegar ao
 * navegador. Não importar isto de componente client.
 */

type Credenciais = { cloud: string; chave: string; segredo: string };

/**
 * Lidas na chamada, não no topo do módulo: em `next dev` o `.env.local` é
 * lido na subida, e uma constante de módulo esconderia a variável faltando
 * atrás de um erro sem relação.
 */
function credenciais(): Credenciais | null {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const chave = process.env.CLOUDINARY_API_KEY;
  const segredo = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !chave || !segredo) return null;
  return { cloud, chave, segredo };
}

export function cloudinaryConfigurado() {
  return credenciais() !== null;
}

function cabecalho({ chave, segredo }: Credenciais) {
  const basica = Buffer.from(`${chave}:${segredo}`).toString("base64");
  return { Authorization: `Basic ${basica}` };
}

/** Teto da Admin API por chamada. */
const LOTE = 100;

/**
 * Apaga imagens no Cloudinary.
 *
 * Em lote de cem por chamada, e não uma requisição por foto: limpar uma OS
 * com dez fotos são dez viagens, e limpar cinquenta OS seriam quinhentas.
 *
 * Devolve quantas o Cloudinary confirmou. Falha de rede não estoura: a linha
 * do banco já pode ter saído, e travar o dono no meio de uma limpeza é pior
 * do que um arquivo órfão — que esta mesma tela mostra depois.
 */
export async function apagarImagens(publicIds: string[]): Promise<number> {
  const cred = credenciais();
  if (!cred || publicIds.length === 0) return 0;

  let apagadas = 0;

  for (let i = 0; i < publicIds.length; i += LOTE) {
    const lote = publicIds.slice(i, i + LOTE);
    const url = new URL(
      `https://api.cloudinary.com/v1_1/${cred.cloud}/resources/image/upload`,
    );
    for (const id of lote) url.searchParams.append("public_ids[]", id);

    try {
      const resposta = await fetch(url, {
        method: "DELETE",
        headers: cabecalho(cred),
      });
      if (!resposta.ok) continue;

      const dados = (await resposta.json()) as {
        deleted?: Record<string, string>;
      };
      apagadas += Object.values(dados.deleted ?? {}).filter(
        (estado) => estado === "deleted",
      ).length;
    } catch {
      // Segue para o próximo lote.
    }
  }

  return apagadas;
}

export type ImagemNaNuvem = { publicId: string; bytes: number };

/**
 * Lista o que existe na conta, sob a pasta das OS.
 *
 * Serve para achar arquivo órfão — o que ficou na nuvem depois de uma falha
 * de rede no meio de um apagamento. Sem isto ele ocupa cota para sempre e
 * não aparece em tela nenhuma.
 *
 * O teto existe porque a Admin API pagina de quinhentos em quinhentos e tem
 * limite de chamadas por hora. A tela diz quantas conferiu.
 */
export async function listarImagens(
  prefixo = "os/",
  teto = 1000,
): Promise<ImagemNaNuvem[] | null> {
  const cred = credenciais();
  if (!cred) return null;

  const achadas: ImagemNaNuvem[] = [];
  let cursor: string | undefined;

  try {
    do {
      const url = new URL(
        `https://api.cloudinary.com/v1_1/${cred.cloud}/resources/image/upload`,
      );
      url.searchParams.set("prefix", prefixo);
      url.searchParams.set("max_results", "500");
      if (cursor) url.searchParams.set("next_cursor", cursor);

      const resposta = await fetch(url, { headers: cabecalho(cred) });
      if (!resposta.ok) return null;

      const dados = (await resposta.json()) as {
        resources?: { public_id: string; bytes: number }[];
        next_cursor?: string;
      };

      for (const r of dados.resources ?? []) {
        achadas.push({ publicId: r.public_id, bytes: r.bytes });
      }
      cursor = dados.next_cursor;
    } while (cursor && achadas.length < teto);
  } catch {
    return null;
  }

  return achadas;
}
