import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../../supabase/client";

function generateTempPassword(): string {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 8);
}

export function RegisterPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    setLoading(true);
    const redirectUrl = `${window.location.origin}/complete-registration`;
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password: generateTempPassword(),
      options: {
        data: {
          full_name: nome,
          needs_password_set: true,
        },
        emailRedirectTo: redirectUrl,
      },
    });
    setLoading(false);

    if (signUpError) {
      setError("Não foi possível enviar o link de confirmação. Tente novamente.");
      return;
    }

    setSuccess(true);
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">Criar conta</h2>
        <p className="mt-1 text-sm text-sf-muted">
          Organize sua vida financeira com poucos cliques.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="sf-label" htmlFor="nome">
            Nome
          </label>
          <input
            id="nome"
            type="text"
            required
            className="sf-input"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Como prefere ser chamado"
          />
        </div>

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

        {error ? <p className="text-xs text-sf-danger">{error}</p> : null}

        <button type="submit" className="sf-button-primary w-full" disabled={loading}>
          {loading ? "Enviando link..." : "Continuar"}
        </button>

        <p className="text-center text-xs text-sf-muted">
          Já tem conta?{" "}
          <Link to="/login" className="font-medium text-sf-primary-300 hover:text-sf-primary-200">
            Fazer login
          </Link>
        </p>
      </form>

      {success ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
          <div className="sf-card max-w-sm px-6 py-5">
            <h3 className="text-sm font-semibold text-white">Verifique seu email</h3>
            <p className="mt-2 text-xs text-sf-muted">
              Enviamos um link de confirmação para <strong className="text-white">{email}</strong>.
            </p>
            <p className="mt-2 text-xs text-sf-muted">
              Clique no link recebido para validar seu email e continuar o cadastro. Se não
              aparecer na caixa de entrada, confira o <strong>spam</strong> ou a pasta de
              promoções.
            </p>
            <p className="mt-2 text-xs text-sf-muted">
              Após clicar no link, você será redirecionado para criar sua senha e concluir o
              cadastro.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Link
                to="/login"
                className="sf-button-primary inline-block px-4 py-2 text-center text-sm"
              >
                Ir para login
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
