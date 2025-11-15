import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export const signUp = async (email: string, password: string, fullName: string) => {
  const redirectUrl = `${window.location.origin}/`;
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        full_name: fullName,
      },
    },
  });

  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getSession = async (): Promise<{ session: Session | null; user: User | null }> => {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { 
    session: error ? null : session,
    user: error ? null : session?.user ?? null
  };
};

export const onAuthStateChange = (callback: (session: Session | null, user: User | null) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session, session?.user ?? null);
  });

  return subscription;
};
