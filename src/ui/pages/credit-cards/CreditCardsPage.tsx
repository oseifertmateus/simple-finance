import { useEffect, useState } from "react";
import { supabase } from "../../../supabase/client";
import { useSupabaseSession } from "../../../supabase/SupabaseProvider";
import { getBillingCycleDates } from "../../../utils/billingCycle";

const MAX_CREDIT_CARDS = 3;

/** Normaliza data ISO (ex: 2025-02-26T00:00:00.000Z) para YYYY-MM-DD para comparação. */
function getDateOnly(dateStr: string | undefined): string {
  if (!dateStr) return "";
  return String(dateStr).slice(0, 10);
}

type CreditCard = {
  id: string;
  user_id: string;
  name: string;
  bank: string;
  limit_amount: number;
  due_day: number;
  closing_day: number;
};

type TransactionRow = {
  id: string;
  credit_card_id: string | null;
  date: string;
  amount: number;
  type: string;
};

export function CreditCardsPage() {
  const { session } = useSupabaseSession();
  const [cartoes, setCartoes] = useState<CreditCard[]>([]);
  const [transacoes, setTransacoes] = useState<TransactionRow[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastErro, setToastErro] = useState(false);

  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [modalDeletarId, setModalDeletarId] = useState<string | null>(null);

  const [formNovo, setFormNovo] = useState<Omit<CreditCard, "id" | "user_id">>({
    name: "",
    bank: "",
    limit_amount: 0,
    due_day: 1,
    closing_day: 1,
  });

  const [formEditar, setFormEditar] = useState<CreditCard | null>(null);

  useEffect(() => {
    async function carregar() {
      if (!session) return;
      setCarregando(true);
      setErroCarregamento(null);

      const [resCartoes, resTransacoes] = await Promise.all([
        supabase
          .from("credit_cards")
          .select("*")
          .eq("user_id", session.user.id)
          .order("name", { ascending: true }),
        supabase
          .from("transactions")
          .select("id, credit_card_id, date, amount, type")
          .eq("user_id", session.user.id)
          .not("credit_card_id", "is", null),
      ]);

      if (resCartoes.error) {
        setErroCarregamento("Não foi possível carregar os cartões.");
        setCarregando(false);
        return;
      }

      setCartoes((resCartoes.data ?? []) as CreditCard[]);

      if (resTransacoes.error) {
        setTransacoes([]);
      } else {
        setTransacoes((resTransacoes.data ?? []) as TransactionRow[]);
      }
      setCarregando(false);
    }

    void carregar();
  }, [session]);

  function getUsoFaturaAtual(card: CreditCard): number {
    const { start, end } = getBillingCycleDates(card.closing_day);
    return transacoes
      .filter(
        (t) =>
          t.credit_card_id === card.id &&
          t.type === "saida" &&
          getDateOnly(t.date) >= start &&
          getDateOnly(t.date) <= end,
      )
      .reduce((acc, t) => acc + Math.abs(Number(t.amount) || 0), 0);
  }

  function abrirNovoModal() {
    if (cartoes.length >= MAX_CREDIT_CARDS) {
      setToastErro(true);
      setToast("Você atingiu o limite máximo de 3 cartões cadastrados.");
      setTimeout(() => {
        setToast(null);
        setToastErro(false);
      }, 3500);
      return;
    }
    setFormNovo({
      name: "",
      bank: "",
      limit_amount: 0,
      due_day: 1,
      closing_day: 1,
    });
    setModalNovoAberto(true);
  }

  function fecharNovoModal() {
    setModalNovoAberto(false);
  }

  function abrirEditarModal(card: CreditCard) {
    setFormEditar({ ...card });
    setModalEditarAberto(true);
  }

  function fecharEditarModal() {
    setModalEditarAberto(false);
    setFormEditar(null);
  }

  async function salvarNovo() {
    if (!session) return;

    const { data, error } = await supabase
      .from("credit_cards")
      .insert({
        user_id: session.user.id,
        name: formNovo.name,
        bank: formNovo.bank,
        limit_amount: formNovo.limit_amount,
        due_day: formNovo.due_day,
        closing_day: formNovo.closing_day,
      })
      .select("*")
      .single();

    if (error) {
      setToastErro(true);
      setToast("Erro ao cadastrar cartão.");
      setTimeout(() => {
        setToast(null);
        setToastErro(false);
      }, 3500);
      return;
    }

    if (data) {
      setCartoes((atual) => [data as CreditCard, ...atual]);
    }
    setModalNovoAberto(false);
    setToast("Cartão cadastrado com sucesso.");
    setTimeout(() => setToast(null), 3500);
  }

  async function salvarEdicao() {
    if (!formEditar) return;

    const { error } = await supabase
      .from("credit_cards")
      .update({
        name: formEditar.name,
        bank: formEditar.bank,
        limit_amount: formEditar.limit_amount,
        due_day: formEditar.due_day,
        closing_day: formEditar.closing_day,
      })
      .eq("id", formEditar.id)
      .eq("user_id", session?.user.id ?? "");

    if (error) {
      setToastErro(true);
      setToast("Erro ao atualizar cartão.");
      setTimeout(() => {
        setToast(null);
        setToastErro(false);
      }, 3500);
      return;
    }

    setCartoes((atual) =>
      atual.map((c) => (c.id === formEditar.id ? formEditar : c)),
    );
    setModalEditarAberto(false);
    setFormEditar(null);
    setToast("Cartão atualizado com sucesso.");
    setTimeout(() => setToast(null), 3500);
  }

  async function confirmarDeletar() {
    if (!modalDeletarId) return;

    const { error } = await supabase
      .from("credit_cards")
      .delete()
      .eq("id", modalDeletarId)
      .eq("user_id", session?.user.id ?? "");

    if (error) {
      setToastErro(true);
      setToast("Erro ao deletar cartão.");
      setTimeout(() => {
        setToast(null);
        setToastErro(false);
      }, 3500);
      setModalDeletarId(null);
      return;
    }

    setCartoes((atual) => atual.filter((c) => c.id !== modalDeletarId));
    setModalDeletarId(null);
    setToast("Cartão deletado com sucesso.");
    setTimeout(() => setToast(null), 3500);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Cartões de Crédito</h1>
          <p className="text-xs text-sf-muted">
            Gerencie seus cartões e acompanhe o uso da fatura atual.
          </p>
        </div>
        <button
          type="button"
          className="sf-button-primary"
          onClick={abrirNovoModal}
        >
          Novo Cartão
        </button>
      </div>

      {carregando ? (
        <div className="py-12 text-center text-sm text-sf-muted">
          Carregando cartões...
        </div>
      ) : erroCarregamento ? (
        <div className="sf-card px-6 py-8 text-center text-sm text-sf-danger">
          {erroCarregamento}
        </div>
      ) : cartoes.length === 0 ? (
        <div className="sf-card px-6 py-12 text-center">
          <p className="text-sm text-sf-muted">
            Nenhum cartão cadastrado. Clique em &quot;Novo Cartão&quot; para começar.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {cartoes.map((card) => (
            <CreditCardVisual
              key={card.id}
              card={card}
              usoFatura={getUsoFaturaAtual(card)}
              onEditar={() => abrirEditarModal(card)}
              onDeletar={() => setModalDeletarId(card.id)}
            />
          ))}
        </div>
      )}

      {modalNovoAberto ? (
        <ModalCartao
          titulo="Novo Cartão"
          form={formNovo}
          onChange={setFormNovo}
          onFechar={fecharNovoModal}
          onSalvar={salvarNovo}
        />
      ) : null}

      {modalEditarAberto && formEditar ? (
        <ModalCartao
          titulo="Editar Cartão"
          form={formEditar}
          onChange={setFormEditar}
          onFechar={fecharEditarModal}
          onSalvar={salvarEdicao}
          isEdicao
        />
      ) : null}

      {modalDeletarId ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
          <div className="sf-card max-w-sm px-6 py-5">
            <h3 className="text-sm font-semibold text-white">Deletar cartão</h3>
            <p className="mt-2 text-xs text-sf-muted">
              Essa ação não pode ser desfeita. Tem certeza que deseja excluir este cartão?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="sf-button-ghost text-xs"
                onClick={() => setModalDeletarId(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="rounded-lg bg-sf-danger px-3 py-1.5 text-xs font-medium text-white hover:bg-sf-danger/90"
                onClick={confirmarDeletar}
              >
                Sim, deletar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            className={`sf-card px-4 py-3 text-xs ${
              toastErro
                ? "border-sf-danger/60 bg-sf-surface-elevated/95 text-sf-danger"
                : "border-sf-success/40 bg-sf-surface-elevated/95 text-sf-success"
            }`}
          >
            {toast}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CreditCardVisual({
  card,
  usoFatura,
  onEditar,
  onDeletar,
}: {
  card: CreditCard;
  usoFatura: number;
  onEditar: () => void;
  onDeletar: () => void;
}) {
  const limite = Number(card.limit_amount);
  const percentual = limite > 0 ? Math.min(100, (usoFatura / limite) * 100) : 0;
  const disponivel = Math.max(0, limite - usoFatura);

  return (
    <div className="sf-card overflow-hidden p-0">
      <div className="relative rounded-t-xl bg-gradient-to-br from-sf-primary-600 via-sf-primary-700 to-sf-primary-800 px-5 py-6 text-white">
        <div className="text-[11px] uppercase tracking-widest opacity-80">
          {card.bank}
        </div>
        <div className="mt-2 text-lg font-semibold">{card.name}</div>
        <div className="mt-4 text-right text-sm font-medium">
          Limite:{" "}
          {limite.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </div>
        <div className="mt-1 text-right text-xs opacity-90">
          Vencimento: dia {card.due_day}
        </div>
      </div>

      <div className="border-t border-sf-border px-5 py-4">
        <div className="mb-2 flex justify-between text-[11px] text-sf-muted">
          <span>Uso da fatura atual</span>
          <span>{percentual.toFixed(0)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-sf-surface-elevated">
          <div
            className={`h-full rounded-full transition-all ${
              percentual >= 90 ? "bg-sf-danger" : percentual >= 70 ? "bg-amber-500" : "bg-sf-primary-500"
            }`}
            style={{ width: `${percentual}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] text-sf-muted">
          {usoFatura.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}{" "}
          usado • R$ {disponivel.toLocaleString("pt-BR")} disponível
        </p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-lg border border-sf-border px-3 py-1.5 text-xs font-medium text-sf-muted transition hover:bg-sf-surface-elevated"
            onClick={onEditar}
          >
            Editar
          </button>
          <button
            type="button"
            className="rounded-lg border border-sf-danger/50 px-3 py-1.5 text-xs font-medium text-sf-danger transition hover:bg-sf-danger/10"
            onClick={onDeletar}
          >
            Deletar
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalCartao({
  titulo,
  form,
  onChange,
  onFechar,
  onSalvar,
  isEdicao,
}: {
  titulo: string;
  form: Partial<CreditCard>;
  onChange: (f: Partial<CreditCard>) => void;
  onFechar: () => void;
  onSalvar: () => void;
  isEdicao?: boolean;
}) {
  const valid =
    form.name?.trim() &&
    form.bank?.trim() &&
    (form.limit_amount ?? 0) >= 0 &&
    (form.due_day ?? 1) >= 1 &&
    (form.due_day ?? 1) <= 31 &&
    (form.closing_day ?? 1) >= 1 &&
    (form.closing_day ?? 1) <= 31;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 px-4">
      <div className="sf-card w-full max-w-lg px-6 py-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">{titulo}</h3>
          <button type="button" onClick={onFechar} className="sf-button-ghost px-2 py-1 text-xs">
            Fechar
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="sf-label">Nome do cartão</label>
            <input
              className="sf-input"
              value={form.name ?? ""}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="sf-label">Banco</label>
            <input
              className="sf-input"
              value={form.bank ?? ""}
              onChange={(e) => onChange({ ...form, bank: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="sf-label">Limite (R$)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              className="sf-input"
              value={form.limit_amount ?? ""}
              onChange={(e) =>
                onChange({ ...form, limit_amount: Number(e.target.value) || 0 })
              }
            />
          </div>

          <div className="space-y-1.5">
            <label className="sf-label">Dia de vencimento</label>
            <input
              type="number"
              min={1}
              max={31}
              className="sf-input"
              value={form.due_day ?? 1}
              onChange={(e) =>
                onChange({ ...form, due_day: Math.min(31, Math.max(1, Number(e.target.value) || 1)) })
              }
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="sf-label">Dia de fechamento</label>
            <input
              type="number"
              min={1}
              max={31}
              className="sf-input"
              value={form.closing_day ?? 1}
              onChange={(e) =>
                onChange({
                  ...form,
                  closing_day: Math.min(31, Math.max(1, Number(e.target.value) || 1)),
                })
              }
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="sf-button-ghost text-xs" onClick={onFechar}>
            Cancelar
          </button>
          <button
            type="button"
            className="sf-button-primary text-xs disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!valid}
            onClick={onSalvar}
          >
            {isEdicao ? "Salvar alterações" : "Cadastrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
