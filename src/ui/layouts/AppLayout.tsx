import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "../../supabase/client";

export function AppLayout() {
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-sf-surface">
      <aside className="flex w-64 flex-col border-r border-sf-border bg-sf-surface-elevated/80 backdrop-blur">
        <div className="flex items-center gap-2 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sf-primary-600 text-sm font-semibold text-white">
            SF
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Simple Finance</p>
            <p className="text-[11px] text-sf-muted">Seu painel financeiro pessoal</p>
          </div>
        </div>

        <nav className="mt-4 flex-1 space-y-1 px-3 text-sm">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-lg px-3 py-2.5 transition ${
                isActive
                  ? "bg-sf-primary-600/15 text-sf-primary-200"
                  : "text-sf-muted hover:bg-sf-surface-elevated"
              }`
            }
          >
            <span className="h-5 w-5 rounded-md bg-sf-primary-600/20" />
            Dashboard
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-lg px-3 py-2.5 transition ${
                isActive
                  ? "bg-sf-primary-600/15 text-sf-primary-200"
                  : "text-sf-muted hover:bg-sf-surface-elevated"
              }`
            }
          >
            <span className="h-5 w-5 rounded-md bg-sf-primary-600/20" />
            Configurações
          </NavLink>
        </nav>

        <div className="border-t border-sf-border px-3 py-4">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-sf-danger/90 hover:bg-sf-danger/10"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-gradient-to-br from-sf-surface via-sf-surface-elevated to-sf-primary-950/60">
        <header className="flex items-center justify-between border-b border-sf-border/60 px-8 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-sf-muted">Painel</p>
            <p className="mt-1 text-sm font-medium text-white">Visão geral financeira</p>
          </div>
          <Link
            to="/dashboard"
            className="rounded-full border border-sf-border bg-sf-surface-elevated px-3 py-1.5 text-[11px] text-sf-muted hover:border-sf-primary-600/60 hover:text-sf-primary-100"
          >
            Hoje é um bom dia para organizar suas finanças
          </Link>
        </header>

        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
