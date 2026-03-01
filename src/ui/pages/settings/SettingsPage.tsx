import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../../../supabase/client";
import { useSupabaseSession } from "../../../supabase/SupabaseProvider";
import { Toast } from "../../components/Toast";

type ToastState = { message: string; type: "success" | "error" } | null;

type UsersProfileRow = {
  id: string;
  name: string | null;
  email: string;
};

export function SettingsPage() {
  const { session } = useSupabaseSession();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");
  const [loadingPerfil, setLoadingPerfil] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingSenha, setLoadingSenha] = useState(false);
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
  }

  function clearToast() {
    setToast(null);
  }

  useEffect(() => {
    async function carregarDados() {
      if (!session) {
        setLoadingInicial(false);
        return;
      }
      setLoadingInicial(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingInicial(false);
        return;
      }

      const { data: profile } = await supabase
        .from("users_profile")
        .select("name, email")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setNome((profile as UsersProfileRow).name ?? "");
        setEmail((profile as UsersProfileRow).email ?? user.email ?? "");
      } else {
        setNome(user.user_metadata?.full_name ?? "");
        setEmail(user.email ?? "");
      }

      setLoadingInicial(false);
    }

    void carregarDados();
  }, [session]);

  async function handleSalvarPerfil(e: FormEvent) {
    e.preventDefault();
    if (!session) return;

    setLoadingPerfil(true);
    try {
      const { error } = await supabase
        .from("users_profile")
        .upsert(
          { id: session.user.id, name: nome, email: session.user.email ?? email },
          { onConflict: "id" }
        );

      if (error) throw error;

      await supabase.auth.updateUser({ data: { full_name: nome } });
      showToast("Nome atualizado com sucesso!", "success");
    } catch {
      showToast("Não foi possível atualizar o nome. Tente novamente.", "error");
    } finally {
      setLoadingPerfil(false);
    }
  }

  async function handleAlterarEmail(e: FormEvent) {
    e.preventDefault();
    if (!session || !novoEmail.trim()) return;

    setLoadingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: novoEmail.trim() });
      if (error) throw error;

      const { error: updateProfile } = await supabase
        .from("users_profile")
        .update({ email: novoEmail.trim() })
        .eq("id", session.user.id);

      if (updateProfile) {
        await supabase
          .from("users_profile")
          .upsert(
            { id: session.user.id, name: nome, email: novoEmail.trim() },
            { onConflict: "id" }
          );
      }

      setEmail(novoEmail.trim());
      setNovoEmail("");
      showToast("Alteração solicitada. Confirme no novo endereço, se necessário.", "success");
    } catch {
      showToast("Não foi possível alterar o email. Tente novamente.", "error");
    } finally {
      setLoadingEmail(false);
    }
  }

  async function handleAlterarSenha(e: FormEvent) {
    e.preventDefault();
    if (!session) return;

    if (novaSenha !== confirmarNovaSenha) {
      showToast("As senhas não coincidem.", "error");
      return;
    }

    if (novaSenha.length < 6) {
      showToast("A nova senha deve ter pelo menos 6 caracteres.", "error");
      return;
    }

    setLoadingSenha(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: session.user.email ?? "",
        password: senhaAtual,
      });
      if (signInError) {
        showToast("Senha atual incorreta.", "error");
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) throw error;

      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarNovaSenha("");
      showToast("Senha atualizada com sucesso!", "success");
    } catch {
      showToast("Não foi possível atualizar a senha. Tente novamente.", "error");
    } finally {
      setLoadingSenha(false);
    }
  }

  if (loadingInicial) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sf-primary-400 border-t-transparent" />
        <p className="text-sm text-sf-muted">Carregando configurações...</p>
      </div>
    );
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
              className="sf-input read-only:opacity-90 read-only:cursor-default"
              type="email"
              value={email}
              readOnly
              placeholder="email@atual.com"
            />
          </div>

          <button
            type="submit"
            className="sf-button-primary w-fit text-xs"
            disabled={loadingPerfil}
          >
            {loadingPerfil ? "Salvando..." : "Salvar dados"}
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
            <label className="sf-label">Email atual</label>
            <input
              className="sf-input read-only:opacity-90 read-only:cursor-default"
              type="email"
              value={email}
              readOnly
              placeholder="email@atual.com"
            />
          </div>
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

          <button
            type="submit"
            className="sf-button-primary w-fit text-xs"
            disabled={loadingEmail || !novoEmail.trim()}
          >
            {loadingEmail ? "Salvando..." : "Atualizar email"}
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

          <button
            type="submit"
            className="sf-button-primary w-fit text-xs"
            disabled={loadingSenha}
          >
            {loadingSenha ? "Salvando..." : "Atualizar senha"}
          </button>
        </form>
      </section>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={clearToast} />
      )}
    </div>
  );
}
