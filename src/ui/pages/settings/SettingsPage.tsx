import { FormEvent, useState } from "react";
import { supabase } from "../../../supabase/client";

export function SettingsPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSalvarPerfil(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setMensagem(null);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: nome },
    });
    if (error) {
      setErro("Não foi possível atualizar os dados cadastrais.");
      return;
    }
    setMensagem("Dados atualizados com sucesso.");
  }

  async function handleAlterarEmail(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setMensagem(null);
    const { error } = await supabase.auth.updateUser({
      email: novoEmail,
    });
    if (error) {
      setErro("Não foi possível alterar o email.");
      return;
    }
    setMensagem("Email atualizado. Confirme no novo endereço, se necessário.");
  }

  async function handleAlterarSenha(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setMensagem(null);
    if (novaSenha !== confirmarNovaSenha) {
      setErro("As senhas não coincidem.");
      return;
    }
    const { error } = await supabase.auth.updateUser({
      password: novaSenha,
    });
    if (error) {
      setErro("Não foi possível alterar a senha.");
      return;
    }
    setMensagem("Senha alterada com sucesso.");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">Configurações</h1>
        <p className="text-xs text-sf-muted">
          Gerencie seus dados cadastrais, email e senha com segurança.
        </p>
      </div>

      <section className="sf-card px-5 py-4">
        <h2 className="text-sm font-semibold text-white">Dados cadastrais</h2>
        <p className="text-xs text-sf-muted">
          Habilite e edite seus dados pessoais utilizados no Simple Finance.
        </p>
        <form onSubmit={handleSalvarPerfil} className="mt-4 grid gap-3 sm:max-w-md">
          <div className="space-y-1.5">
            <label className="sf-label">Nome</label>
            <input
              className="sf-input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome completo"
            />
          </div>

          <div className="space-y-1.5">
            <label className="sf-label">Email atual (somente leitura)</label>
            <input
              className="sf-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@atual.com"
              readOnly
            />
          </div>

          <button type="submit" className="sf-button-primary w-fit text-xs">
            Salvar dados
          </button>
        </form>
      </section>

      <section className="sf-card px-5 py-4">
        <h2 className="text-sm font-semibold text-white">Alterar email</h2>
        <p className="text-xs text-sf-muted">
          Confirme seu email atual e insira o novo endereço que deseja utilizar.
        </p>
        <form onSubmit={handleAlterarEmail} className="mt-4 grid gap-3 sm:max-w-md">
          <div className="space-y-1.5">
            <label className="sf-label">Novo email</label>
            <input
              className="sf-input"
              type="email"
              value={novoEmail}
              onChange={(e) => setNovoEmail(e.target.value)}
              placeholder="novoemail@exemplo.com"
            />
          </div>

          <button type="submit" className="sf-button-primary w-fit text-xs">
            Atualizar email
          </button>
        </form>
      </section>

      <section className="sf-card px-5 py-4">
        <h2 className="text-sm font-semibold text-white">Alterar senha</h2>
        <p className="text-xs text-sf-muted">
          Por segurança, informe sua senha atual antes de criar uma nova.
        </p>

        <form onSubmit={handleAlterarSenha} className="mt-4 grid gap-3 sm:max-w-md">
          <div className="space-y-1.5">
            <label className="sf-label">Senha atual</label>
            <input
              className="sf-input"
              type="password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              placeholder="Sua senha atual"
            />
          </div>
          <div className="space-y-1.5">
            <label className="sf-label">Nova senha</label>
            <input
              className="sf-input"
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Crie uma nova senha"
            />
          </div>
          <div className="space-y-1.5">
            <label className="sf-label">Confirmar nova senha</label>
            <input
              className="sf-input"
              type="password"
              value={confirmarNovaSenha}
              onChange={(e) => setConfirmarNovaSenha(e.target.value)}
              placeholder="Repita a nova senha"
            />
          </div>

          {erro ? <p className="text-xs text-sf-danger">{erro}</p> : null}
          {mensagem ? <p className="text-xs text-sf-success">{mensagem}</p> : null}

          <button type="submit" className="sf-button-primary w-fit text-xs">
            Atualizar senha
          </button>
        </form>
      </section>
    </div>
  );
}
