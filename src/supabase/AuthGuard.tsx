import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { useSupabaseSession } from "./SupabaseProvider";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { session, loading } = useSupabaseSession();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sf-surface">
        <div className="sf-card px-6 py-4 text-sm text-sf-muted">Carregando sessão...</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
