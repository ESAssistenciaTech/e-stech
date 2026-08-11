import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Rotas que qualquer pessoa pode abrir sem login.
 *
 * A lista é de **permissão**, não de bloqueio: tudo que não estiver aqui exige
 * sessão. Errar pra menos aqui deixa uma tela pública fora do ar, e o erro
 * aparece na hora. Uma lista de bloqueio faria o oposto — esquecer uma rota
 * deixaria a área administrativa aberta, em silêncio.
 */
const ROTAS_PUBLICAS = ["/", "/login", "/acompanhar"];

function ehPublica(pathname: string) {
  return ROTAS_PUBLICAS.some(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`),
  );
}

export async function atualizarSessao(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Esta chamada é o que de fato renova o token e regrava o cookie.
  // Sem ela o cliente acima não faz nada e a sessão expira sozinha.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !ehPublica(request.nextUrl.pathname)) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("proxima", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  return response;
}
