import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../supabase/client";
import { useSupabaseSession } from "../../../supabase/SupabaseProvider";

export function CompleteRegistrationPage() {
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { session, loading: authLoading } = useSupabaseSession();

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      navigate("/login", { replace: true });
      return;
    }
    const needsPassword = session.user.user_metadata?.needs_password_set;
    if (!needsPassword) {
      navigate("/dashboard", { replace: true });
    }
  }, [session, authLoading, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (senha !== confirmarSenha) {
      setError("As senhas não coincidem.");
      return;
    }

    if (senha.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password: senha,
      data: {
        needs_password_set: false,
      },
    });
    setLoading(false);

    if (updateError) {
      setError("Não foi possível definir a senha. Tente novamente.");
      return;
    }

    navigate("/dashboard", { replace: true });
  }

  if (authLoading || !session || !session.user.user_metadata?.needs_password_set) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sf-primary-400 border-t-transparent" />
        <p className="text-sm text-sf-muted">Carregando...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">Criar sua senha</h2>
        <p className="mt-1 text-sm text-sf-muted">
          Email confirmado. Defina uma senha segura para acessar sua conta.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="sf-label" htmlFor="senha">
            Senha
          </label>
          <input
            id="senha"
            type="password"
            required
            minLength={6}
            className="sf-input"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Crie uma senha segura (mín. 6 caracteres)"
          />
        </div>

        <div className="space-y-1.5">
          <label className="sf-label" htmlFor="confirmar-senha">
            Confirmar senha
          </label>
          <input
            id="confirmar-senha"
            type="password"
            required
            minLength={6}
            className="sf-input"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            placeholder="Repita a senha"
          />
        </div>

        {error ? <p className="text-xs text-sf-danger">{error}</p> : null}

        <button type="submit" className="sf-button-primary w-full" disabled={loading}>
          {loading ? "Salvando..." : "Concluir cadastro"}
        </button>
      </form>
    </div>
  );
}
