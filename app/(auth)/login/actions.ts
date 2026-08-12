"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EstadoLogin = { erro: string | null };

export async function entrar(
  _anterior: EstadoLogin,
  form: FormData,
): Promise<EstadoLogin> {
  const email = String(form.get("email") ?? "").trim();
  const senha = String(form.get("senha") ?? "");
  const proxima = String(form.get("proxima") ?? "/dashboard");

  if (!email || !senha) {
    return { erro: "Preencha email e senha." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) {
    // Não distinguir "email não existe" de "senha errada": isso deixaria
    // descobrir quais emails têm conta.
    return { erro: "Email ou senha incorretos." };
  }

  revalidatePath("/", "layout");
  redirect(proxima.startsWith("/") ? proxima : "/dashboard");
}

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
