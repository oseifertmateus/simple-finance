import { Outlet, Link } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-sf-surface via-sf-surface-elevated to-sf-primary-900/40">
      <div className="m-auto flex w-full max-w-5xl overflow-hidden rounded-2xl border border-sf-border bg-sf-surface-elevated shadow-2xl shadow-sf-primary-900/40">
        <aside className="hidden w-1/2 flex-col justify-between border-r border-sf-border bg-gradient-to-b from-sf-primary-900 via-sf-primary-800 to-sf-surface px-10 py-8 md:flex">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-sf-surface/40 px-3 py-1 text-xs font-medium text-sf-primary-100 ring-1 ring-sf-primary-300/40">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Gestão financeira simples
            </div>
            <h1 className="mt-6 text-3xl font-semibold text-white">
              Simple <span className="text-sf-primary-300">Finance</span>
            </h1>
            <p className="mt-3 text-sm text-sf-primary-100/80">
              Centralize entradas, saídas e investimentos em um painel único, com visão clara
              do seu balanço.
            </p>
          </div>

          <div className="space-y-3 text-xs text-sf-primary-100/70">
            <p className="font-medium text-sf-primary-100">Principais vantagens</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-sf-success" />
                Controle de fluxo de caixa em tempo real
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-sf-invest" />
                Visão clara dos seus investimentos
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-sf-danger" />
                Alertas visuais para gastos excessivos
              </li>
            </ul>
          </div>

          <p className="text-xs text-sf-primary-200/70">
            Desenvolvido para pessoas que querem cuidar melhor do próprio dinheiro, sem
            planilhas complicadas.
          </p>
        </aside>

        <main className="flex w-full flex-1 flex-col justify-center px-6 py-10 md:w-1/2 md:px-10">
          <div className="mb-6 flex items-center justify-between md:hidden">
            <Link to="/login" className="flex items-center gap-2 text-sm font-semibold text-white">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-sf-primary-600 text-xs">
                SF
              </span>
              Simple Finance
            </Link>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
