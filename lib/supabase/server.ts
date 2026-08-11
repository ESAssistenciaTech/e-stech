import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente do Supabase para Server Components, Server Actions e route handlers.
 *
 * Usa a chave publicável, que é pública por natureza — quem protege os dados é
 * o RLS no banco, não o segredo da chave. Nenhuma rota deve assumir proteção
 * vinda daqui.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Chamado de dentro de um Server Component, onde não dá pra
            // escrever cookie. Pode ignorar: o middleware já renova a sessão.
          }
        },
      },
    },
  );
}
