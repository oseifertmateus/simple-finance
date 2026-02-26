import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./client";

type SupabaseContextValue = {
  session: Session | null;
  loading: boolean;
};

const SupabaseContext = createContext<SupabaseContextValue | undefined>(undefined);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SupabaseContext.Provider value={{ session, loading }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabaseSession() {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error("useSupabaseSession deve ser usado dentro de SupabaseProvider");
  return ctx;
}
