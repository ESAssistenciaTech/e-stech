"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CampoSenha } from "./campo-senha";
import {
  ROTULO_IDENTIFICADOR,
  TIPOS_APARELHO,
  type Marca,
  type TipoAparelho,
  type TipoSenha,
} from "@/lib/tipos";

const campo =
  "h-12 w-full rounded-lg border border-line bg-white px-3 text-base text-ink outline-none focus:border-cyan-deep";

export type ValoresAparelho = {
  aparelho_tipo: TipoAparelho | null;
  aparelho_marca: string | null;
  aparelho_modelo: string | null;
  aparelho_identificador: string | null;
  senha_aparelho: string | null;
  senha_tipo: TipoSenha | null;
  marca_nao_identificada: boolean;
  modelo_nao_identificado: boolean;
  identificador_nao_identificado: boolean;
};

const OUTRA = "__outra__";

function NaoIdentificado({
  name,
  marcado,
  onChange,
  rotulo,
}: {
  name: string;
  marcado: boolean;
  onChange: (v: boolean) => void;
  rotulo: string;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-mute">
      <input
        type="checkbox"
        name={name}
        checked={marcado}
        onChange={(e) => onChange(e.target.checked)}
        className="size-5 accent-amber"
      />
      {rotulo}
    </label>
  );
}

export function BlocoAparelho({
  marcas,
  inicial,
}: {
  marcas: Marca[];
  inicial?: Partial<ValoresAparelho>;
}) {
  const [tipo, setTipo] = useState<TipoAparelho | "">(
    inicial?.aparelho_tipo ?? "",
  );

  const marcaInicial = inicial?.aparelho_marca ?? "";
  const conheceMarca = marcas.some((m) => m.nome === marcaInicial);
  const [marca, setMarca] = useState(
    marcaInicial && !conheceMarca ? OUTRA : marcaInicial,
  );
  const [marcaLivre, setMarcaLivre] = useState(
    marcaInicial && !conheceMarca ? marcaInicial : "",
  );

  const [modelo, setModelo] = useState(inicial?.aparelho_modelo ?? "");
  const [modelosVistos, setModelosVistos] = useState<string[]>([]);

  const [semMarca, setSemMarca] = useState(
    inicial?.marca_nao_identificada ?? false,
  );
  const [semModelo, setSemModelo] = useState(
    inicial?.modelo_nao_identificado ?? false,
  );
  const [semId, setSemId] = useState(
    inicial?.identificador_nao_identificado ?? false,
  );

  const marcaEfetiva = marca === OUTRA ? marcaLivre : marca;

  // Modelo não é cadastro: a sugestão sai do que já foi digitado naquela
  // marca. Uma vez usado, vira opção pra sempre — sem catálogo pra manter.
  useEffect(() => {
    if (!marcaEfetiva) {
      setModelosVistos([]);
      return;
    }
    let cancelado = false;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("ordens_servico")
        .select("aparelho_modelo")
        .eq("aparelho_marca", marcaEfetiva)
        .not("aparelho_modelo", "is", null)
        .limit(200);
      if (cancelado) return;
      const nomes = [
        ...new Set((data ?? []).map((o) => o.aparelho_modelo as string)),
      ].sort();
      setModelosVistos(nomes);
    })();
    return () => {
      cancelado = true;
    };
  }, [marcaEfetiva]);

  const marcasDoTipo = tipo
    ? marcas.filter((m) => m.tipos.includes(tipo))
    : marcas;

  return (
    <div className="flex flex-col gap-3">
      <select
        name="aparelho_tipo"
        value={tipo}
        onChange={(e) => {
          setTipo(e.target.value as TipoAparelho | "");
          setMarca("");
          setMarcaLivre("");
        }}
        className={campo}
      >
        <option value="">Sem aparelho</option>
        {TIPOS_APARELHO.map((t) => (
          <option key={t} value={t}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </option>
        ))}
      </select>

      {tipo && (
        <>
          {/* Marca ---------------------------------------------------- */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-mute" htmlFor="marca">
              Marca
            </label>
            <select
              id="marca"
              value={marca}
              onChange={(e) => {
                setMarca(e.target.value);
                setModelo("");
              }}
              disabled={semMarca}
              className={`${campo} disabled:opacity-50`}
            >
              <option value="">Escolha</option>
              {marcasDoTipo.map((m) => (
                <option key={m.id} value={m.nome}>
                  {m.nome}
                </option>
              ))}
              <option value={OUTRA}>Outra…</option>
            </select>

            {marca === OUTRA && !semMarca && (
              <input
                value={marcaLivre}
                onChange={(e) => setMarcaLivre(e.target.value)}
                placeholder="Qual marca?"
                className={campo}
              />
            )}

            <input
              type="hidden"
              name="aparelho_marca"
              value={semMarca ? "" : marcaEfetiva}
            />

            <NaoIdentificado
              name="marca_nao_identificada"
              marcado={semMarca}
              onChange={setSemMarca}
              rotulo="Não deu pra identificar a marca"
            />
          </div>

          {/* Modelo --------------------------------------------------- */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-mute" htmlFor="modelo">
              Modelo
            </label>
            <input
              id="modelo"
              name="aparelho_modelo"
              value={semModelo ? "" : modelo}
              onChange={(e) => setModelo(e.target.value)}
              disabled={semModelo}
              list="modelos-vistos"
              placeholder={
                marcaEfetiva ? `Modelo ${marcaEfetiva}` : "Escolha a marca antes"
              }
              className={`${campo} disabled:opacity-50`}
            />
            <datalist id="modelos-vistos">
              {modelosVistos.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
            {modelosVistos.length > 0 && !semModelo && (
              <span className="text-xs text-mute">
                {modelosVistos.length}{" "}
                {modelosVistos.length === 1 ? "modelo já usado" : "modelos já usados"}{" "}
                nessa marca — comece a digitar pra ver.
              </span>
            )}

            <NaoIdentificado
              name="modelo_nao_identificado"
              marcado={semModelo}
              onChange={setSemModelo}
              rotulo="Não deu pra identificar o modelo"
            />
          </div>

          {/* Identificador -------------------------------------------- */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-mute" htmlFor="ident">
              {ROTULO_IDENTIFICADOR[tipo]}
            </label>
            <input
              id="ident"
              name="aparelho_identificador"
              defaultValue={inicial?.aparelho_identificador ?? ""}
              disabled={semId}
              className={`dado ${campo} disabled:opacity-50`}
            />
            <NaoIdentificado
              name="identificador_nao_identificado"
              marcado={semId}
              onChange={setSemId}
              rotulo={`Não deu pra ler o ${ROTULO_IDENTIFICADOR[tipo].toLowerCase()} — aparelho não liga ou tela danificada`}
            />
          </div>

          <div className="border-t border-line pt-3">
            <CampoSenha
              tipoInicial={inicial?.senha_tipo}
              valorInicial={inicial?.senha_aparelho}
            />
          </div>
        </>
      )}
    </div>
  );
}
