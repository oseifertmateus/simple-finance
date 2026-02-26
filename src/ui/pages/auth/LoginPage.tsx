import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../../supabase/client";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });
    setLoading(false);
    if (signInError) {
      setError("Não foi possível entrar. Verifique seus dados.");
      return;
    }

    const redirectTo = (location.state as { from?: Location })?.from?.pathname ?? "/dashboard";
    navigate(redirectTo, { replace: true });
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">Bem-vindo de volta</h2>
        <p className="mt-1 text-sm text-sf-muted">
          Acesse sua conta para acompanhar entradas, saídas e investimentos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="sf-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            className="sf-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="sf-label" htmlFor="senha">
              Senha
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-sf-primary-300 hover:text-sf-primary-200"
            >
              Esqueceu a senha?
            </Link>
          </div>
          <input
            id="senha"
            type="password"
            required
            className="sf-input"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Sua senha"
          />
        </div>

        {error ? <p className="text-xs text-sf-danger">{error}</p> : null}

        <button type="submit" className="sf-button-primary w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <p className="text-center text-xs text-sf-muted">
          Não tem conta?{" "}
          <Link
            to="/register"
            className="font-medium text-sf-primary-300 hover:text-sf-primary-200"
          >
            Criar conta
          </Link>
        </p>
      </form>
    </div>
  );
}
