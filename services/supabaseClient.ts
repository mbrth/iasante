import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://acdvitudqfldqcpbrrox.supabase.co';          // ← remplace par ton URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjZHZpdHVkcWZsZHFjcGJycm94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyOTE2MTEsImV4cCI6MjA4Njg2NzYxMX0.Cs6BlSlTqWy_M-Hb0nTYlY63vEP4A2FGQ4xJaOmxn4E';                   // ← colle ta clé publishable ici


const createSafeClient = (): SupabaseClient => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      'Supabase: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY est manquant. ' +
      'L’authentification distante est désactivée tant que ces variables ne sont pas définies.'
    );

    // Client factice pour éviter de crasher l’app en dev
    return {
      auth: {
        async getSession() {
          return { data: { session: null }, error: null } as any;
        },
        async signInWithPassword() {
          return { data: null, error: { message: 'Supabase non configuré (URL/clé manquantes).' } } as any;
        },
        async signUp() {
          return { data: null, error: { message: 'Supabase non configuré (URL/clé manquantes).' } } as any;
        },
        async signOut() {
          return { error: null } as any;
        },
        // autres méthodes non utilisées dans cette app
      } as any,
      from() {
        return {
          select() {
            return Promise.resolve({
              data: null,
              error: { message: 'Supabase non configuré (URL/clé manquantes).' },
            }) as any;
          },
          upsert() {
            return Promise.resolve({
              data: null,
              error: { message: 'Supabase non configuré (URL/clé manquantes).' },
            }) as any;
          },
        } as any;
      },
    } as SupabaseClient;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = createSafeClient();

