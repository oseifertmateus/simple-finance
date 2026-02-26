import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../../supabase/client";

export function RegisterPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (senha !== confirmarSenha) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          full_name: nome,
        },
      },
    });
    setLoading(false);

    if (signUpError) {
      setError("Não foi possível criar sua conta. Tente novamente.");
      return;
    }

    setSuccess(true);
  }

  function closeSuccess() {
    setSuccess(false);
    navigate("/login");
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

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="sf-label" htmlFor="senha">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              required
              className="sf-input"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Crie uma senha segura"
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
              className="sf-input"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="Repita a senha"
            />
          </div>
        </div>

        {error ? <p className="text-xs text-sf-danger">{error}</p> : null}

        <button type="submit" className="sf-button-primary w-full" disabled={loading}>
          {loading ? "Criando conta..." : "Criar conta"}
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
            <h3 className="text-sm font-semibold text-white">Conta criada com sucesso</h3>
            <p className="mt-2 text-xs text-sf-muted">
              Sua conta foi criada. Confirme seu email (se configurado no Supabase) e volte para
              a tela de login para acessar o Simple Finance.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="sf-button-primary" onClick={closeSuccess}>
                Voltar para login
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
