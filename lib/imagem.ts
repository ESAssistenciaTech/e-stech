/**
 * Compressão no navegador, antes de subir.
 *
 * Não é otimização, é requisito. Foto de celular moderno tem 3 a 4 MB; com
 * dez por OS, o plano gratuito acabaria em poucas dezenas de ordens. A
 * 1280px com qualidade 75 cada foto fica em torno de 200 KB, e arranhão
 * continua perfeitamente visível — ninguém precisa de 4000px para provar
 * que a quina estava amassada.
 */
const LADO_MAXIMO = 1280;
const QUALIDADE = 0.75;

export type FotoComprimida = {
  arquivo: Blob;
  largura: number;
  altura: number;
  /** Para mostrar antes de enviar. Revogar depois de usar. */
  previa: string;
};

export async function comprimir(entrada: File): Promise<FotoComprimida> {
  const bitmap = await createImageBitmap(entrada);

  const escala = Math.min(
    1,
    LADO_MAXIMO / Math.max(bitmap.width, bitmap.height),
  );
  const largura = Math.round(bitmap.width * escala);
  const altura = Math.round(bitmap.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Este navegador não consegue processar a imagem.");
  ctx.drawImage(bitmap, 0, 0, largura, altura);
  bitmap.close();

  const arquivo = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALIDADE),
  );
  if (!arquivo) throw new Error("Não foi possível processar a imagem.");

  return {
    arquivo,
    largura,
    altura,
    previa: URL.createObjectURL(arquivo),
  };
}

/**
 * URL de entrega com transformação.
 *
 * Montada à mão de propósito: o Cloudinary já é CDN e faz o corte, então
 * passar por otimizador de imagem em cima disso gastaria cota da Vercel
 * para refazer trabalho já feito.
 */
export function versao(url: string, largura: number) {
  return url.replace(
    "/upload/",
    `/upload/w_${largura},c_limit,q_auto,f_auto/`,
  );
}

export function tamanhoLegivel(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
