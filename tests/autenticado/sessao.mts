/**
 * Apoio dos testes autenticados: entra com a sessão real e limpa o que criou.
 *
 * ATENÇÃO: isto ESCREVE no banco apontado por `NEXT_PUBLIC_SUPABASE_URL`.
 * O sistema tem um banco só, então não existe "banco de teste" a menos que
 * você aponte um segundo projeto Supabase. Tudo que é criado leva o prefixo
 * `zz-teste-`, é apagado no fim, e o que sobrou de uma execução quebrada é
 * varrido antes da próxima.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const MARCA = "zz-teste-";

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CHAVE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const EMAIL = process.env.TESTE_EMAIL;
const SENHA = process.env.TESTE_SENHA;

export const semCredenciais = !URL_SUPABASE || !CHAVE || !EMAIL || !SENHA;
export const motivo =
  "sem TESTE_EMAIL e TESTE_SENHA no ambiente (ver .env.example)";

/** Entra e devolve o cliente com sessão. Estoura se a senha estiver errada. */
export async function entrar(): Promise<SupabaseClient> {
  const supabase = createClient(URL_SUPABASE!, CHAVE!);
  const { error } = await supabase.auth.signInWithPassword({
    email: EMAIL!,
    password: SENHA!,
  });

  if (error) {
    throw new Error(
      `Não foi possível entrar com TESTE_EMAIL: ${error.message}`,
    );
  }

  return supabase;
}

/**
 * Cookie de sessão no formato que o `@supabase/ssr` lê.
 *
 * O nome carrega a referência do projeto, e o valor é `base64-` seguido do
 * JSON da sessão em base64. É o que o servidor do Next espera receber — sem
 * isto, toda rota administrativa responde com redirecionamento para o login.
 */
export async function cookieDeSessao(supabase: SupabaseClient) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Entrou, mas não veio sessão.");

  const ref = new global.URL(URL_SUPABASE!).hostname.split(".")[0];
  const valor = Buffer.from(JSON.stringify(session)).toString("base64");
  return `sb-${ref}-auth-token=base64-${valor}`;
}

/**
 * Apaga tudo que carrega a marca.
 *
 * Roda antes e depois: antes porque execução quebrada deixa sobra visível nas
 * telas do dono, e depois porque é o combinado. A ordem importa —
 * `movimentacoes_caixa` aponta para a OS com `on delete set null`, então
 * apagar a OS primeiro deixaria o lançamento órfão no caixa.
 */
export async function varrer(supabase: SupabaseClient) {
  const { data: clientes } = await supabase
    .from("clientes")
    .select("id")
    .like("nome", `${MARCA}%`);

  const idsClientes = (clientes ?? []).map((c) => c.id);

  if (idsClientes.length > 0) {
    const { data: ordens } = await supabase
      .from("ordens_servico")
      .select("id")
      .in("cliente_id", idsClientes);

    const idsOrdens = (ordens ?? []).map((o) => o.id);

    if (idsOrdens.length > 0) {
      await supabase
        .from("movimentacoes_caixa")
        .delete()
        .in("ordem_servico_id", idsOrdens);
      // os_servicos e os_fotos caem por cascade.
      await supabase.from("ordens_servico").delete().in("id", idsOrdens);
    }

    await supabase.from("clientes").delete().in("id", idsClientes);
  }

  // Só depois das OS: os_servicos referencia tipos_servico com restrict.
  await supabase.from("tipos_servico").delete().like("nome", `${MARCA}%`);
  await supabase.from("insumos").delete().like("nome", `${MARCA}%`);
  await supabase
    .from("movimentacoes_caixa")
    .delete()
    .like("descricao", `${MARCA}%`);
  await supabase
    .from("aparelhos_doadores")
    .delete()
    .like("modelo", `${MARCA}%`);
}
