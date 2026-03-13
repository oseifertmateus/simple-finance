import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../../supabase/client";

function isRecoveryFlow(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hash.includes("type=recovery");
}

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "reset">(() =>
    isRecoveryFlow() ? "reset" : "email"
  );
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (step === "reset" && isRecoveryFlow()) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [step]);

  async function handleSendEmail(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/forgot-password",
    });

    setLoading(false);
    if (resetError) {
      setError("Não foi possível enviar o email de recuperação.");
      return;
    }

    setMessage("Verifique seu email e siga as instruções para redefinir a senha.");
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (novaSenha !== confirmarNovaSenha) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password: novaSenha,
    });
    setLoading(false);

    if (updateError) {
      setError("Não foi possível atualizar sua senha.");
      return;
    }

    navigate("/login", { replace: true });
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">Recuperar conta</h2>
        <p className="mt-1 text-sm text-sf-muted">
          {step === "email"
            ? "Informe seu email para receber o link de redefinição de senha."
            : "Crie uma nova senha para sua conta."}
        </p>
      </div>

      {step === "email" ? (
        <form onSubmit={handleSendEmail} className="space-y-4">
          <div className="space-y-1.5">
            <label className="sf-label" htmlFor="email">
              Email cadastrado
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

          {error ? <p className="text-xs text-sf-danger">{error}</p> : null}
          {message ? <p className="text-xs text-sf-success">{message}</p> : null}

          <button type="submit" className="sf-button-primary w-full" disabled={loading}>
            {loading ? "Enviando..." : "Enviar email de recuperação"}
          </button>

          <p className="text-center text-xs text-sf-muted">
            Lembrou a senha?{" "}
            <Link
              to="/login"
              className="font-medium text-sf-primary-300 hover:text-sf-primary-200"
            >
              Voltar para login
            </Link>
          </p>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-1.5">
            <label className="sf-label" htmlFor="nova-senha">
              Nova senha
            </label>
            <input
              id="nova-senha"
              type="password"
              required
              className="sf-input"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Digite a nova senha"
            />
          </div>
          <div className="space-y-1.5">
            <label className="sf-label" htmlFor="confirmar-nova-senha">
              Confirmar nova senha
            </label>
            <input
              id="confirmar-nova-senha"
              type="password"
              required
              className="sf-input"
              value={confirmarNovaSenha}
              onChange={(e) => setConfirmarNovaSenha(e.target.value)}
              placeholder="Repita a nova senha"
            />
          </div>

          {error ? <p className="text-xs text-sf-danger">{error}</p> : null}

          <button type="submit" className="sf-button-primary w-full" disabled={loading}>
            {loading ? "Atualizando..." : "Salvar nova senha"}
          </button>

          <p className="text-center text-xs text-sf-muted">
            Lembrou a senha?{" "}
            <Link
              to="/login"
              className="font-medium text-sf-primary-300 hover:text-sf-primary-200"
            >
              Voltar para login
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
