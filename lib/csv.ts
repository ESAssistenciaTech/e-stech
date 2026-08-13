/**
 * Geração de CSV para o Excel em português.
 *
 * Duas decisões que parecem detalhe e não são: o separador é ponto e
 * vírgula, porque no Excel configurado em pt-BR a vírgula é separador
 * decimal e um arquivo com vírgula abre tudo numa coluna só; e o arquivo
 * começa com BOM, senão acento vira caractere quebrado ao abrir.
 */

function celula(valor: unknown): string {
  if (valor === null || valor === undefined) return "";

  const texto = String(valor);
  // Aspas, quebra de linha e o próprio separador exigem envolver em aspas.
  if (/[";\r\n]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

export function paraCSV(
  colunas: { chave: string; rotulo: string }[],
  linhas: Record<string, unknown>[],
): string {
  const cabecalho = colunas.map((c) => celula(c.rotulo)).join(";");
  const corpo = linhas.map((linha) =>
    colunas.map((c) => celula(linha[c.chave])).join(";"),
  );
  // BOM + CRLF: é o que o Excel espera.
  return "﻿" + [cabecalho, ...corpo].join("\r\n");
}

export function respostaCSV(nome: string, conteudo: string) {
  const hoje = new Date().toISOString().slice(0, 10);
  return new Response(conteudo, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nome}-${hoje}.csv"`,
      // Backup não pode vir de cache: tem que ser o estado de agora.
      "Cache-Control": "no-store",
    },
  });
}
