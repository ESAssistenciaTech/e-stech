"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { comprimir, tamanhoLegivel } from "@/lib/imagem";
import { assinarUpload, registrarFoto } from "./actions";

type Momento = "entrada" | "entrega";

export function EnviarFotos({
  ordemServicoId,
  momento,
}: {
  ordemServicoId: string;
  momento: Momento;
}) {
  const router = useRouter();
  const entrada = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [economia, setEconomia] = useState<string | null>(null);

  async function selecionou(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = [...(e.target.files ?? [])];
    if (arquivos.length === 0) return;

    setEnviando(true);
    setErro(null);
    setEconomia(null);

    try {
      const credenciais = await assinarUpload(ordemServicoId);
      if ("erro" in credenciais) {
        setErro(credenciais.erro);
        return;
      }

      let original = 0;
      let final = 0;

      for (const [i, arquivo] of arquivos.entries()) {
        setProgresso(`Preparando ${i + 1} de ${arquivos.length}…`);
        const foto = await comprimir(arquivo);
        original += arquivo.size;
        final += foto.arquivo.size;
        URL.revokeObjectURL(foto.previa);

        setProgresso(`Enviando ${i + 1} de ${arquivos.length}…`);
        const corpo = new FormData();
        corpo.append("file", foto.arquivo);
        corpo.append("api_key", credenciais.apiKey);
        corpo.append("timestamp", String(credenciais.timestamp));
        corpo.append("signature", credenciais.assinatura);
        corpo.append("folder", credenciais.pasta);

        const resposta = await fetch(
          `https://api.cloudinary.com/v1_1/${credenciais.cloudName}/image/upload`,
          { method: "POST", body: corpo },
        );

        if (!resposta.ok) {
          setErro("O envio falhou. Confira a conexão e tente de novo.");
          return;
        }

        const dados = await resposta.json();
        const registro = await registrarFoto({
          ordemServicoId,
          momento,
          url: dados.secure_url,
          publicId: dados.public_id,
          largura: foto.largura,
          altura: foto.altura,
        });
        if (registro.erro) {
          setErro(registro.erro);
          return;
        }
      }

      setEconomia(
        `${arquivos.length === 1 ? "1 foto" : `${arquivos.length} fotos`} · ${tamanhoLegivel(original)} viraram ${tamanhoLegivel(final)}`,
      );
      router.refresh();
    } catch {
      setErro("Não foi possível processar as fotos deste aparelho.");
    } finally {
      setEnviando(false);
      setProgresso(null);
      if (entrada.current) entrada.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* capture abre a câmera direto: a foto é tirada no balcão, com o
          aparelho na mão, não escolhida da galeria. */}
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={selecionou}
        disabled={enviando}
        className="hidden"
        id={`foto-${momento}`}
      />
      <label
        htmlFor={`foto-${momento}`}
        className={`flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-line bg-white font-display font-semibold text-navy ${
          enviando ? "opacity-60" : "hover:border-cyan-deep"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5"
          aria-hidden
        >
          <path d="M3 8h3l2-3h8l2 3h3v12H3z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
        {enviando ? (progresso ?? "Enviando…") : "Tirar ou escolher fotos"}
      </label>

      {erro && (
        <p role="alert" className="text-sm font-medium text-status-recusado">
          {erro}
        </p>
      )}
      {economia && (
        <p role="status" className="dado text-xs text-mute">
          {economia}
        </p>
      )}
    </div>
  );
}
